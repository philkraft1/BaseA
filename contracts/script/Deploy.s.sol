// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StandingOrder} from "../src/StandingOrder.sol";

contract Deploy is Script {
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() public {
        address operator = vm.envOr("OPERATOR_ADDRESS", address(0));
        vm.startBroadcast();
        StandingOrder standing = new StandingOrder(USDC, operator);
        console.log("StandingOrder deployed at:", address(standing));
        vm.stopBroadcast();
    }
}
