// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PayRequest} from "../src/PayRequest.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract PayRequestTest is Test {
    PayRequest internal payRequest;
    MockERC20 internal usdc;
    address internal payee = address(0xA11CE);
    address internal payer = address(0xB0B);

    function setUp() public {
        payRequest = new PayRequest();
        usdc = new MockERC20();
        usdc.mint(payer, 1_000e6);
    }

    function test_CreateAndPay() public {
        vm.prank(payee);
        uint256 id = payRequest.createRequest(payer, address(usdc), 25e6, "dinner");

        vm.startPrank(payer);
        usdc.approve(address(payRequest), 25e6);
        payRequest.pay(id);
        vm.stopPrank();

        PayRequest.Request memory req = payRequest.getRequest(id);
        assertTrue(req.paid);
        assertEq(req.paidBy, payer);
        assertEq(usdc.balanceOf(payee), 25e6);
    }

    function test_AnyoneCanPayOpenRequest() public {
        vm.prank(payee);
        uint256 id = payRequest.createRequest(address(0), address(usdc), 10e6, "open");

        vm.startPrank(payer);
        usdc.approve(address(payRequest), 10e6);
        payRequest.pay(id);
        vm.stopPrank();

        assertEq(usdc.balanceOf(payee), 10e6);
    }

    function test_RevertUnauthorizedPayer() public {
        vm.prank(payee);
        uint256 id = payRequest.createRequest(payer, address(usdc), 10e6, "private");

        address stranger = address(0xBAD);
        usdc.mint(stranger, 10e6);
        vm.startPrank(stranger);
        usdc.approve(address(payRequest), 10e6);
        vm.expectRevert(PayRequest.NotAuthorizedPayer.selector);
        payRequest.pay(id);
        vm.stopPrank();
    }

    function test_RevertDoublePay() public {
        vm.prank(payee);
        uint256 id = payRequest.createRequest(payer, address(usdc), 5e6, "once");

        vm.startPrank(payer);
        usdc.approve(address(payRequest), 10e6);
        payRequest.pay(id);
        vm.expectRevert(PayRequest.AlreadyPaid.selector);
        payRequest.pay(id);
        vm.stopPrank();
    }

    function test_RevertZeroAmount() public {
        vm.prank(payee);
        vm.expectRevert(PayRequest.InvalidAmount.selector);
        payRequest.createRequest(payer, address(usdc), 0, "zero");
    }
}
