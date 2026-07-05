// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@fhevm-solidity-0.11.1/lib/FHE.sol";

/// @title ClearingEngine
/// @notice Tick-based clearing algorithm for sealed-bid batch auctions
/// @dev Implements O(N × K) clearing where N=orders, K=ticks
/// @dev Phase 1: All-or-nothing fills (no partial fills)
contract ClearingEngine {
    /// @notice Tick configuration
    uint256 public constant MIN_TICK = 0;
    uint256 public constant MAX_TICK = 999;     // 1000 ticks total
    uint256 public constant TICK_COUNT = 1000;

    /// @notice Price range mapping (example: $0.01 to $100)
    /// @dev Tick i maps to price: MIN_PRICE + (i * TICK_SPACING)
    uint256 public constant MIN_PRICE = 1e16;      // 0.01 USD (18 decimals)
    uint256 public constant MAX_PRICE = 100e18;    // 100 USD
    uint256 public constant TICK_SPACING = 99e15;  // ~0.099 USD per tick

    /// @notice Tick aggregation structure
    struct TickAggregate {
        euint64 buyVolume;      // Total encrypted buy volume at this tick
        euint64 sellVolume;     // Total encrypted sell volume at this tick
        uint256 buyCount;       // Number of buy orders
        uint256 sellCount;      // Number of sell orders
    }

    /// @notice Tick aggregates for current batch
    mapping(uint256 => TickAggregate) public tickAggregates;

    /// @notice Convert tick index to price
    /// @param tick Tick index (0 to MAX_TICK)
    /// @return price Price in wei
    function tickToPrice(uint256 tick) public pure returns (uint256 price) {
        require(tick <= MAX_TICK, "tick out of bounds");
        return MIN_PRICE + (tick * TICK_SPACING);
    }

    /// @notice Convert price to nearest tick index
    /// @param price Price in wei
    /// @return tick Tick index
    function priceToTick(uint256 price) public pure returns (uint256 tick) {
        require(price >= MIN_PRICE && price <= MAX_PRICE, "price out of range");
        return (price - MIN_PRICE) / TICK_SPACING;
    }

    /// @notice Add order to tick aggregates
    /// @param isBuy True if buy order
    /// @param limitPrice Encrypted limit price (tick index as euint64)
    /// @param size Encrypted order size
    function _addToTick(bool isBuy, euint64 limitPrice, euint64 size) internal {
        // NOTE: In Phase 1, we'll need to iterate through ticks during clearing
        // For now, this is a placeholder for the aggregation logic
        // Full implementation requires conditional accumulation at each tick
        
        // Conceptual algorithm:
        // for (uint256 tick = MIN_TICK; tick <= MAX_TICK; tick++) {
        //     if (isBuy) {
        //         // Buy order: add to all ticks <= limitPrice
        //         ebool shouldAdd = FHE.le(FHE.asEuint64(tick), limitPrice);
        //         euint64 addAmount = FHE.select(shouldAdd, size, FHE.asEuint64(0));
        //         tickAggregates[tick].buyVolume = FHE.add(
        //             tickAggregates[tick].buyVolume,
        //             addAmount
        //         );
        //     } else {
        //         // Sell order: add to all ticks >= limitPrice
        //         ebool shouldAdd = FHE.ge(FHE.asEuint64(tick), limitPrice);
        //         euint64 addAmount = FHE.select(shouldAdd, size, FHE.asEuint64(0));
        //         tickAggregates[tick].sellVolume = FHE.add(
        //             tickAggregates[tick].sellVolume,
        //             addAmount
        //         );
        //     }
        // }
    }

    /// @notice Find clearing price (tick where supply meets demand)
    /// @dev Iterates through tick range to find equilibrium
    /// @param tickStart Starting tick to scan
    /// @param tickEnd Ending tick to scan
    /// @return clearingTick Tick index with maximum matched volume
    /// @return matchedVolume Volume matched at clearing price (plaintext)
    function findClearingPrice(uint256 tickStart, uint256 tickEnd)
        public
        view
        returns (uint256 clearingTick, uint256 matchedVolume)
    {
        require(tickStart <= tickEnd && tickEnd <= MAX_TICK, "invalid tick range");

        uint256 bestTick = tickStart;
        uint256 maxVolume = 0;

        // Scan ticks to find maximum matched volume
        for (uint256 tick = tickStart; tick <= tickEnd; tick++) {
            TickAggregate memory agg = tickAggregates[tick];

            // Temporarily mock FHE.decrypt since synchronous decryption is removed in fhevm >= 0.4
            uint64 buyVol = _mockDecrypt(agg.buyVolume);
            uint64 sellVol = _mockDecrypt(agg.sellVolume);

            // Matched volume is min(buy, sell)
            uint256 matched = buyVol < sellVol ? buyVol : sellVol;

            if (matched > maxVolume) {
                maxVolume = matched;
                bestTick = tick;
            }
        }

        return (bestTick, maxVolume);
    }

    /// @notice Clear all tick aggregates (called at batch start)
    function _clearTicks() internal {
        // In practice, we'd need to track which ticks were used
        // For MVP, we can reset on-demand or use a batch-scoped mapping
        // Placeholder: actual implementation would iterate used ticks
    }

    /// @notice Check if order should fill at clearing price
    /// @dev Phase 1: All-or-nothing logic
    /// @param isBuy Order type
    /// @param limitPrice Order's encrypted limit price
    /// @param clearingTick Clearing price tick index
    /// @return shouldFill Encrypted boolean indicating fill decision
    function shouldFillOrder(
        bool isBuy,
        euint64 limitPrice,
        uint256 clearingTick
    ) public returns (ebool shouldFill) {
        euint64 clearingPriceEnc = FHE.asEuint64(uint64(clearingTick));

        if (isBuy) {
            // Buy order fills if limit >= clearing price
            return FHE.ge(limitPrice, clearingPriceEnc);
        } else {
            // Sell order fills if limit <= clearing price
            return FHE.le(limitPrice, clearingPriceEnc);
        }
    }

    // Temporary mock for FHE.decrypt (Removed in fhevm >= 0.4)
    function _mockDecrypt(euint64 value) internal view returns (uint64) {
        return uint64(uint256(euint64.unwrap(value)));
    }

    /// @notice Get tick aggregate (for testing)
    /// @param tick Tick index
    /// @return buyVolume Encrypted buy volume
    /// @return sellVolume Encrypted sell volume
    /// @return buyCount Number of buy orders
    /// @return sellCount Number of sell orders
    function getTickAggregate(uint256 tick)
        external
        view
        returns (euint64 buyVolume, euint64 sellVolume, uint256 buyCount, uint256 sellCount)
    {
        TickAggregate memory agg = tickAggregates[tick];
        return (agg.buyVolume, agg.sellVolume, agg.buyCount, agg.sellCount);
    }
}
