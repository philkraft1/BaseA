// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StandingOrder} from "../src/StandingOrder.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract StandingOrderTest is Test {
    StandingOrder internal orders;
    MockERC20 internal usdc;
    address internal payer = address(0xB0B);
    address internal payee = address(0xA11CE);
    address internal operator = address(0x333);

    function setUp() public {
        usdc = new MockERC20();
        orders = new StandingOrder(address(usdc), operator);
        usdc.mint(payer, 1_000e6);
        vm.prank(payer);
        usdc.approve(address(orders), type(uint256).max);
    }

    function _create() internal returns (uint256 id) {
        vm.prank(payer);
        id = orders.create(payee, address(usdc), 50e6, 7 days, bytes32(0), "rent");
    }

    function test_CreateAndPayPeriod() public {
        uint256 id = _create();

        vm.prank(payer);
        orders.payPeriod(id);

        StandingOrder.Order memory order = orders.getOrder(id);
        assertEq(order.paymentCount, 1);
        assertEq(order.totalPaid, 50e6);
        assertEq(usdc.balanceOf(payee), 50e6);
        assertFalse(orders.isDue(id));
    }

    function test_RevertSecondPaySamePeriod() public {
        uint256 id = _create();
        vm.prank(payer);
        orders.payPeriod(id);

        vm.prank(payer);
        vm.expectRevert(StandingOrder.NotDue.selector);
        orders.payPeriod(id);
    }

    function test_PayAgainAfterPeriod() public {
        uint256 id = _create();
        vm.prank(payer);
        orders.payPeriod(id);

        vm.warp(block.timestamp + 7 days);
        vm.prank(payer);
        orders.payPeriod(id);

        StandingOrder.Order memory order = orders.getOrder(id);
        assertEq(order.paymentCount, 2);
        assertEq(usdc.balanceOf(payee), 100e6);
    }

    function test_OperatorRecordPayment() public {
        uint256 id = _create();
        vm.prank(operator);
        orders.recordPayment(id, 50e6);

        StandingOrder.Order memory order = orders.getOrder(id);
        assertEq(order.paymentCount, 1);
        assertEq(order.totalPaid, 50e6);
        assertFalse(orders.isDue(id));
    }

    function test_RevertStrangerRecordPayment() public {
        uint256 id = _create();
        vm.prank(payer);
        vm.expectRevert(StandingOrder.NotOperator.selector);
        orders.recordPayment(id, 50e6);
    }

    function test_AttachSubscriptionAndCancel() public {
        uint256 id = _create();
        bytes32 subId = keccak256("sub");
        vm.prank(payer);
        orders.attachSubscription(id, subId);
        assertEq(orders.getOrder(id).subscriptionId, subId);

        vm.prank(payer);
        orders.cancel(id);
        assertTrue(orders.getOrder(id).cancelled);

        vm.prank(payer);
        vm.expectRevert(StandingOrder.Cancelled.selector);
        orders.payPeriod(id);
    }

    function test_RevertInvalidCreate() public {
        vm.startPrank(payer);
        vm.expectRevert(StandingOrder.InvalidAmount.selector);
        orders.create(payee, address(usdc), 0, 7 days, bytes32(0), "");

        vm.expectRevert(StandingOrder.InvalidPayee.selector);
        orders.create(payer, address(usdc), 1e6, 7 days, bytes32(0), "");

        vm.expectRevert(StandingOrder.InvalidPeriod.selector);
        orders.create(payee, address(usdc), 1e6, 1 hours, bytes32(0), "");
        vm.stopPrank();
    }

    function test_RevertWrongToken() public {
        MockERC20 other = new MockERC20();
        vm.prank(payer);
        vm.expectRevert(StandingOrder.InvalidToken.selector);
        orders.create(payee, address(other), 1e6, 7 days, bytes32(0), "");
    }

    function test_RevertMemoTooLong() public {
        string memory longMemo = new string(257);
        vm.prank(payer);
        vm.expectRevert(StandingOrder.MemoTooLong.selector);
        orders.create(payee, address(usdc), 1e6, 7 days, bytes32(0), longMemo);
    }

    function test_SetOperatorAndOwnership() public {
        address nextOp = address(0x999);
        orders.setOperator(nextOp);
        assertEq(orders.operator(), nextOp);

        vm.prank(payer);
        vm.expectRevert(StandingOrder.NotOwner.selector);
        orders.setOperator(operator);

        address nextOwner = address(0xABC);
        orders.transferOwnership(nextOwner);
        assertEq(orders.owner(), nextOwner);
    }

    function test_RevertZeroUsdcConstructor() public {
        vm.expectRevert(StandingOrder.InvalidToken.selector);
        new StandingOrder(address(0), operator);
    }
}
