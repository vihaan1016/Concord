// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../../src/core/BatchAuctionDEX.sol";
import "../../src/mocks/MockConfidentialToken.sol";

/// @title BatchAuctionDEX Test Suite
/// @notice Unit tests for the sealed-bid batch auction DEX
contract BatchAuctionDEXTest is Test {
    BatchAuctionDEX public dex;
    MockConfidentialToken public baseToken;
    MockConfidentialToken public quoteToken;

    address public keeper;
    address public alice;
    address public bob;

    uint256 constant BATCH_DURATION = 5 minutes;
    uint256 constant INITIAL_BALANCE = 10e18;

    function setUp() public {
        // Setup accounts
        keeper = address(this);
        alice = address(0x1);
        bob = address(0x2);

        // Deploy tokens
        baseToken = new MockConfidentialToken("Confidential USDC", "cUSDC");
        quoteToken = new MockConfidentialToken("Confidential DAI", "cDAI");

        // Deploy DEX
        dex = new BatchAuctionDEX(
            keeper,
            address(baseToken),
            address(quoteToken),
            BATCH_DURATION
        );

        // Mint initial tokens to traders
        baseToken.mint(alice, INITIAL_BALANCE);
        quoteToken.mint(alice, INITIAL_BALANCE);
        baseToken.mint(bob, INITIAL_BALANCE);
        quoteToken.mint(bob, INITIAL_BALANCE);

        // Label addresses for better trace output
        vm.label(address(dex), "BatchAuctionDEX");
        vm.label(address(baseToken), "BaseToken");
        vm.label(address(quoteToken), "QuoteToken");
        vm.label(keeper, "Keeper");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
    }

    /// @notice Test initial deployment state
    function test_InitialState() public {
        assertEq(dex.keeper(), keeper);
        assertEq(dex.baseToken(), address(baseToken));
        assertEq(dex.quoteToken(), address(quoteToken));
        assertEq(dex.batchDuration(), BATCH_DURATION);
        assertEq(dex.currentBatchId(), 1);

        IBatchAuction.Batch memory batch = dex.getCurrentBatch();
        assertEq(uint256(batch.status), uint256(IBatchAuction.BatchStatus.Open));
        assertEq(batch.batchId, 1);
    }

    /// @notice Test token minting
    function test_TokenMinting() public {
        uint64 aliceBalance = baseToken.balanceOfDecrypted(alice);
        assertEq(aliceBalance, uint64(INITIAL_BALANCE));

        uint64 bobBalance = quoteToken.balanceOfDecrypted(bob);
        assertEq(bobBalance, uint64(INITIAL_BALANCE));
    }

    /// @notice Test batch closes only after expiry
    function test_BatchCloseAfterExpiry() public {
        // Try to close immediately (should fail)
        vm.expectRevert("batch not expired");
        dex.closeBatch();

        // Fast forward past batch end time
        vm.warp(block.timestamp + BATCH_DURATION + 1);

        // Now should succeed
        dex.closeBatch();

        IBatchAuction.Batch memory batch = dex.getCurrentBatch();
        assertEq(uint256(batch.status), uint256(IBatchAuction.BatchStatus.Closed));
    }

    /// @notice Test only keeper can close batch
    function test_OnlyKeeperCanClose() public {
        vm.warp(block.timestamp + BATCH_DURATION + 1);

        vm.prank(alice);
        vm.expectRevert("only keeper");
        dex.closeBatch();

        // Keeper should succeed
        dex.closeBatch();
    }

    /// @notice Test clearing requires batch to be closed
    function test_ClearRequiresClosed() public {
        vm.expectRevert("batch not closed");
        dex.clearBatch(0, 999);

        // Close batch first
        vm.warp(block.timestamp + BATCH_DURATION + 1);
        dex.closeBatch();

        // Now clearing should work (may not find clearing price with 0 orders)
        dex.clearBatch(0, 999);
        
        IBatchAuction.Batch memory batch = dex.getCurrentBatch();
        assertEq(uint256(batch.status), uint256(IBatchAuction.BatchStatus.Cleared));
    }

    /// @notice Test settle requires batch to be cleared
    function test_SettleRequiresCleared() public {
        vm.expectRevert("batch not cleared");
        dex.settleBatch(0, 0);
    }

    /// @notice Test tick to price conversion
    function test_TickToPrice() public {
        uint256 price0 = dex.tickToPrice(0);
        assertEq(price0, dex.MIN_PRICE());

        uint256 price999 = dex.tickToPrice(999);
        assertLe(price999, dex.MAX_PRICE());

        // Test price increases with tick
        uint256 price500 = dex.tickToPrice(500);
        assertGt(price500, price0);
        assertLt(price500, price999);
    }

    /// @notice Test price to tick conversion
    function test_PriceToTick() public {
        uint256 midPrice = (dex.MIN_PRICE() + dex.MAX_PRICE()) / 2;
        uint256 tick = dex.priceToTick(midPrice);
        assertGe(tick, 0);
        assertLe(tick, dex.MAX_TICK());

        // Test round-trip conversion
        uint256 price = dex.tickToPrice(tick);
        uint256 tickAgain = dex.priceToTick(price);
        assertEq(tick, tickAgain);
    }

    /// @notice Test batch opens automatically after settlement
    function test_NewBatchOpensAfterSettlement() public {
        // Close and clear first batch
        vm.warp(block.timestamp + BATCH_DURATION + 1);
        dex.closeBatch();
        dex.clearBatch(0, 999);

        // Settle (with 0 orders)
        dex.settleBatch(0, 0);

        // Check new batch opened
        assertEq(dex.currentBatchId(), 2);
        IBatchAuction.Batch memory batch = dex.getCurrentBatch();
        assertEq(uint256(batch.status), uint256(IBatchAuction.BatchStatus.Open));
    }

    /// @notice Test tick range bounds
    function test_TickBounds() public {
        assertEq(dex.MIN_TICK(), 0);
        assertEq(dex.MAX_TICK(), 999);
        assertEq(dex.TICK_COUNT(), 1000);
    }

    /// @notice Test price range
    function test_PriceRange() public {
        uint256 minPrice = dex.MIN_PRICE();
        uint256 maxPrice = dex.MAX_PRICE();
        
        assertEq(minPrice, 0.01e18);  // $0.01
        assertEq(maxPrice, 100e18);   // $100
    }

    /// @notice Test keeper address
    function test_KeeperAddress() public {
        assertEq(dex.keeper(), keeper);
    }

    /// @notice Test batch order retrieval (empty batch)
    function test_GetBatchOrdersEmpty() public {
        uint256[] memory orders = dex.getBatchOrders(1);
        assertEq(orders.length, 0);
    }
}
