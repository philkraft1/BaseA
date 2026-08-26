// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StandingOrder} from "../src/StandingOrder.sol";

/// @dev One-shot CREATE2 helper: CDP cannot sign txs with empty `to`.
contract Bootstrap {
    event Deployed(address standing);

    constructor(address usdc, address operator, address owner_) {
        StandingOrder standing = new StandingOrder(usdc, operator);
        standing.transferOwnership(owner_);
        emit Deployed(address(standing));
    }
}
