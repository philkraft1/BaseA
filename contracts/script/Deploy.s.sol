// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PayRequest} from "../src/PayRequest.sol";

contract Deploy is Script {
    function run() public {
        vm.startBroadcast();
        PayRequest payRequest = new PayRequest();
        console.log("PayRequest deployed at:", address(payRequest));
        vm.stopBroadcast();
    }
}
