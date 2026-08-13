// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title PayRequest — USDC request-to-pay on Base
/// @notice Payee creates a request; payer approves USDC then calls pay().
contract PayRequest {
    uint256 public constant MAX_MEMO_BYTES = 256;

    struct Request {
        address payee;
        address payer;
        address token;
        uint256 amount;
        string memo;
        bool paid;
        address paidBy;
    }

    address public immutable usdc;
    uint256 public nextId;
    mapping(uint256 => Request) public requests;
    uint256 private locked = 1;

    event RequestCreated(
        uint256 indexed id,
        address indexed payee,
        address indexed payer,
        address token,
        uint256 amount,
        string memo
    );
    event RequestPaid(uint256 indexed id, address indexed paidBy, uint256 amount);

    error InvalidAmount();
    error InvalidToken();
    error UnknownRequest();
    error AlreadyPaid();
    error NotAuthorizedPayer();
    error TransferFailed();
    error MemoTooLong();
    error Reentrant();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert InvalidToken();
        usdc = usdc_;
    }

    modifier nonReentrant() {
        if (locked == 2) revert Reentrant();
        locked = 2;
        _;
        locked = 1;
    }

    /// @param payer Address allowed to pay, or address(0) for anyone.
    function createRequest(address payer, address token, uint256 amount, string calldata memo)
        external
        returns (uint256 id)
    {
        if (amount == 0) revert InvalidAmount();
        if (token != usdc) revert InvalidToken();
        if (bytes(memo).length > MAX_MEMO_BYTES) revert MemoTooLong();

        id = nextId++;
        requests[id] = Request({
            payee: msg.sender,
            payer: payer,
            token: token,
            amount: amount,
            memo: memo,
            paid: false,
            paidBy: address(0)
        });

        emit RequestCreated(id, msg.sender, payer, token, amount, memo);
    }

    function pay(uint256 id) external nonReentrant {
        Request storage req = requests[id];
        if (req.payee == address(0)) revert UnknownRequest();
        if (req.paid) revert AlreadyPaid();
        if (req.payer != address(0) && req.payer != msg.sender) revert NotAuthorizedPayer();

        req.paid = true;
        req.paidBy = msg.sender;

        _safeTransferFrom(req.token, msg.sender, req.payee, req.amount);

        emit RequestPaid(id, msg.sender, req.amount);
    }

    function getRequest(uint256 id) external view returns (Request memory) {
        return requests[id];
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
