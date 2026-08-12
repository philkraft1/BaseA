// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract Deploy is Script {
    function run() public {
        vm.startBroadcast();
        Counter counter = new Counter();
        console.log("Counter deployed at:", address(counter));
        vm.stopBroadcast();
    }
}
