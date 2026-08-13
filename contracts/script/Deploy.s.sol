// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PayRequest} from "../src/PayRequest.sol";

contract Deploy is Script {
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() public {
        vm.startBroadcast();
        PayRequest payRequest = new PayRequest(USDC);
        console.log("PayRequest deployed at:", address(payRequest));
        vm.stopBroadcast();
    }
}
