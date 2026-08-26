// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title StandingOrder — recurring P2P USDC obligations on Base
/// @notice Payer creates an order; they pay a period onchain, or an operator
///         records a payment after a spend-permission charge.
contract StandingOrder {
    uint256 public constant MAX_MEMO_BYTES = 256;
    uint64 public constant MIN_PERIOD = 1 days;
    uint64 public constant MAX_PERIOD = 365 days;

    struct Order {
        address payer;
        address payee;
        address token;
        uint256 amount;
        uint64 period;
        uint64 lastPaidAt;
        uint256 totalPaid;
        uint256 paymentCount;
        bytes32 subscriptionId;
        string memo;
        bool cancelled;
    }

    address public immutable usdc;
    address public owner;
    address public operator;
    uint256 public nextId;
    mapping(uint256 => Order) public orders;
    uint256 private locked = 1;

    event OrderCreated(
        uint256 indexed id,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint64 period,
        bytes32 subscriptionId,
        string memo
    );
    event PaymentRecorded(
        uint256 indexed id,
        address indexed paidBy,
        uint256 amount,
        uint64 paidAt
    );
    event OrderCancelled(uint256 indexed id, address indexed payer);
    event SubscriptionAttached(uint256 indexed id, bytes32 subscriptionId);
    event OperatorUpdated(address indexed operator);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidAmount();
    error InvalidToken();
    error InvalidPayee();
    error InvalidPeriod();
    error InvalidOwner();
    error UnknownOrder();
    error Cancelled();
    error NotDue();
    error NotPayer();
    error NotOperator();
    error NotOwner();
    error TransferFailed();
    error MemoTooLong();
    error Reentrant();

    constructor(address usdc_, address operator_) {
        if (usdc_ == address(0)) revert InvalidToken();
        usdc = usdc_;
        owner = msg.sender;
        operator = operator_;
        emit OwnershipTransferred(address(0), msg.sender);
        emit OperatorUpdated(operator_);
    }

    modifier nonReentrant() {
        if (locked == 2) revert Reentrant();
        locked = 2;
        _;
        locked = 1;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function create(
        address payee,
        address token,
        uint256 amount,
        uint64 period,
        bytes32 subscriptionId,
        string calldata memo
    ) external returns (uint256 id) {
        if (amount == 0) revert InvalidAmount();
        if (token != usdc) revert InvalidToken();
        if (payee == address(0) || payee == msg.sender) revert InvalidPayee();
        if (period < MIN_PERIOD || period > MAX_PERIOD) revert InvalidPeriod();
        if (bytes(memo).length > MAX_MEMO_BYTES) revert MemoTooLong();

        id = nextId++;
        orders[id] = Order({
            payer: msg.sender,
            payee: payee,
            token: token,
            amount: amount,
            period: period,
            lastPaidAt: 0,
            totalPaid: 0,
            paymentCount: 0,
            subscriptionId: subscriptionId,
            memo: memo,
            cancelled: false
        });

        emit OrderCreated(id, msg.sender, payee, token, amount, period, subscriptionId, memo);
        if (subscriptionId != bytes32(0)) {
            emit SubscriptionAttached(id, subscriptionId);
        }
    }

    /// @notice Payer settles the current period: pull USDC and record onchain.
    function payPeriod(uint256 id) external nonReentrant {
        Order storage order = _requireActive(id);
        if (msg.sender != order.payer) revert NotPayer();
        if (!_isDue(order)) revert NotDue();

        _record(order, id, order.amount, msg.sender);
        _safeTransferFrom(order.token, order.payer, order.payee, order.amount);
    }

    /// @notice Operator records a payment after an offchain spend-permission charge.
    function recordPayment(uint256 id, uint256 amount) external nonReentrant {
        if (msg.sender != operator) revert NotOperator();
        Order storage order = _requireActive(id);
        if (amount == 0) revert InvalidAmount();
        if (!_isDue(order)) revert NotDue();

        _record(order, id, amount, msg.sender);
    }

    function attachSubscription(uint256 id, bytes32 subscriptionId) external {
        Order storage order = _requireActive(id);
        if (msg.sender != order.payer) revert NotPayer();
        order.subscriptionId = subscriptionId;
        emit SubscriptionAttached(id, subscriptionId);
    }

    function cancel(uint256 id) external {
        Order storage order = _requireActive(id);
        if (msg.sender != order.payer) revert NotPayer();
        order.cancelled = true;
        emit OrderCancelled(id, msg.sender);
    }

    function setOperator(address operator_) external onlyOwner {
        operator = operator_;
        emit OperatorUpdated(operator_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function getOrder(uint256 id) external view returns (Order memory) {
        return orders[id];
    }

    function isDue(uint256 id) external view returns (bool) {
        Order storage order = orders[id];
        if (order.payer == address(0) || order.cancelled) return false;
        return _isDue(order);
    }

    function nextDueAt(uint256 id) external view returns (uint64) {
        Order storage order = orders[id];
        if (order.lastPaidAt == 0) return uint64(block.timestamp);
        return order.lastPaidAt + order.period;
    }

    function _requireActive(uint256 id) internal view returns (Order storage order) {
        order = orders[id];
        if (order.payer == address(0)) revert UnknownOrder();
        if (order.cancelled) revert Cancelled();
    }

    function _isDue(Order storage order) internal view returns (bool) {
        if (order.lastPaidAt == 0) return true;
        return block.timestamp >= order.lastPaidAt + order.period;
    }

    function _record(Order storage order, uint256 id, uint256 amount, address paidBy) internal {
        order.lastPaidAt = uint64(block.timestamp);
        order.totalPaid += amount;
        order.paymentCount += 1;
        emit PaymentRecorded(id, paidBy, amount, order.lastPaidAt);
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }
}
