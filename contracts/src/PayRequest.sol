// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title PayRequest — USDC (or any ERC-20) request-to-pay on Base
/// @notice Payee creates a request; payer approves the token then calls pay().
contract PayRequest {
    struct Request {
        address payee;
        address payer;
        address token;
        uint256 amount;
        string memo;
        bool paid;
        address paidBy;
    }

    uint256 public nextId;
    mapping(uint256 => Request) public requests;

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

    /// @param payer Address allowed to pay, or address(0) for anyone.
    function createRequest(address payer, address token, uint256 amount, string calldata memo)
        external
        returns (uint256 id)
    {
        if (amount == 0) revert InvalidAmount();
        if (token == address(0)) revert InvalidToken();

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

    function pay(uint256 id) external {
        Request storage req = requests[id];
        if (req.payee == address(0)) revert UnknownRequest();
        if (req.paid) revert AlreadyPaid();
        if (req.payer != address(0) && req.payer != msg.sender) revert NotAuthorizedPayer();

        req.paid = true;
        req.paidBy = msg.sender;

        bool ok = IERC20(req.token).transferFrom(msg.sender, req.payee, req.amount);
        if (!ok) revert TransferFailed();

        emit RequestPaid(id, msg.sender, req.amount);
    }

    function getRequest(uint256 id) external view returns (Request memory) {
        return requests[id];
    }
}
