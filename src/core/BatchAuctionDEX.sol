// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@fhevm-solidity-0.11.1/lib/FHE.sol";
import "@fhevm-solidity-0.11.1/config/ZamaConfig.sol";
import "../interfaces/IBatchAuction.sol";
import "./ClearingEngine.sol";

/// @title BatchAuctionDEX
/// @notice Sealed-bid batch auction DEX using FHE for confidential order submission
/// @dev Phase 1.0: All-or-nothing fills, keeper-driven lifecycle
contract BatchAuctionDEX is IBatchAuction, ClearingEngine {
    // State variables
    address public keeper;
    address public baseToken;    // Token being sold
    address public quoteToken;   // Token being bought
    
    uint256 public batchDuration;         // Batch duration in seconds
    uint256 public currentBatchId;
    uint256 public nextOrderId;

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256[]) public batchOrders;  // batchId => orderIds

    /// @notice Constructor
    /// @param _keeper Address of keeper bot
    /// @param _baseToken Base token address
    /// @param _quoteToken Quote token address
    /// @param _batchDuration Duration of each batch in seconds
    constructor(
        address _keeper,
        address _baseToken,
        address _quoteToken,
        uint256 _batchDuration
    ) {
        require(_keeper != address(0), "invalid keeper");
        require(_baseToken != address(0), "invalid base token");
        require(_quoteToken != address(0), "invalid quote token");
        require(_batchDuration > 0, "invalid duration");

        // Initialize FHEVM with Zama config
        FHE.setCoprocessor(ZamaConfig.getEthereumCoprocessorConfig());

        keeper = _keeper;
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        batchDuration = _batchDuration;

        // Initialize first batch
        _openNewBatch();
    }

    /// @notice Modifier to restrict functions to keeper
    modifier onlyKeeper() {
        require(msg.sender == keeper, "only keeper");
        _;
    }

    /// @notice Submit a sealed-bid order
    /// @inheritdoc IBatchAuction
    function submitOrder(
        OrderType orderType,
        externalEuint64 encryptedSize,
        externalEuint64 encryptedPrice,
        bytes calldata sizeProof,
        bytes calldata priceProof
    ) external override returns (uint256 orderId) {
        Batch storage batch = batches[currentBatchId];
        require(batch.status == BatchStatus.Open, "batch not open");
        require(block.timestamp < batch.endTime, "batch expired");

        // Convert encrypted inputs
        euint64 size = FHE.fromExternal(encryptedSize, sizeProof);
        euint64 limitPrice = FHE.fromExternal(encryptedPrice, priceProof);

        // Create order
        orderId = nextOrderId++;
        orders[orderId] = Order({
            trader: msg.sender,
            orderType: orderType,
            size: size,
            limitPrice: limitPrice,
            batchId: currentBatchId,
            filled: false
        });

        // Add to batch
        batchOrders[currentBatchId].push(orderId);
        batch.orderCount++;

        emit OrderSubmitted(currentBatchId, orderId, msg.sender, orderType);

        return orderId;
    }

    /// @notice Close the current batch
    /// @inheritdoc IBatchAuction
    function closeBatch() external override onlyKeeper {
        Batch storage batch = batches[currentBatchId];
        require(batch.status == BatchStatus.Open, "batch not open");
        require(block.timestamp >= batch.endTime, "batch not expired");

        batch.status = BatchStatus.Closed;

        emit BatchClosed(currentBatchId, block.timestamp);
    }

    /// @notice Clear the batch and find clearing price
    /// @inheritdoc IBatchAuction
    function clearBatch(uint256 tickStart, uint256 tickEnd) external override onlyKeeper {
        Batch storage batch = batches[currentBatchId];
        require(batch.status == BatchStatus.Closed, "batch not closed");

        // Aggregate orders into ticks
        _aggregateOrdersToTicks(currentBatchId);

        // Find clearing price
        (uint256 clearingTick, uint256 matchedVolume) = findClearingPrice(tickStart, tickEnd);

        batch.clearingPrice = clearingTick;
        batch.status = BatchStatus.Cleared;

        emit BatchCleared(currentBatchId, clearingTick, matchedVolume);
    }

    /// @notice Settle the batch by executing trades
    /// @inheritdoc IBatchAuction
    function settleBatch(uint256 startIndex, uint256 endIndex) external override onlyKeeper {
        Batch storage batch = batches[currentBatchId];
        require(batch.status == BatchStatus.Cleared, "batch not cleared");

        uint256[] memory orderIds = batchOrders[currentBatchId];
        require(endIndex <= orderIds.length, "invalid range");

        uint256 filledCount = 0;

        // Process orders in range
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint256 orderId = orderIds[i];
            Order storage order = orders[orderId];

            // Check if order should fill
            ebool shouldFill = shouldFillOrder(
                order.orderType == OrderType.Buy,
                order.limitPrice,
                batch.clearingPrice
            );

            // Temporarily mock FHE.decrypt (Removed in fhevm >= 0.4)
            bool fills = _mockDecrypt(shouldFill);

            if (fills) {
                // Execute trade
                _executeTrade(order, batch.clearingPrice);
                order.filled = true;
                filledCount++;

                emit OrderFilled(currentBatchId, orderId, order.trader);
            }
        }

        // If all orders processed, mark batch as settled and open new batch
        if (endIndex >= orderIds.length) {
            batch.status = BatchStatus.Settled;
            emit BatchSettled(currentBatchId, filledCount);
            _openNewBatch();
        }
    }

    /// @notice Get current batch information
    /// @inheritdoc IBatchAuction
    function getCurrentBatch() external view override returns (Batch memory) {
        return batches[currentBatchId];
    }

    /// @notice Get order details
    /// @inheritdoc IBatchAuction
    function getOrder(uint256 orderId) external view override returns (Order memory) {
        return orders[orderId];
    }

    /// @notice Check if order was filled
    /// @inheritdoc IBatchAuction
    function isOrderFilled(uint256 orderId) external view override returns (bool) {
        return orders[orderId].filled;
    }

    /// @notice Open a new batch
    function _openNewBatch() internal {
        currentBatchId++;
        
        batches[currentBatchId] = Batch({
            batchId: currentBatchId,
            startTime: block.timestamp,
            endTime: block.timestamp + batchDuration,
            status: BatchStatus.Open,
            clearingPrice: 0,
            orderCount: 0
        });

        emit BatchOpened(currentBatchId, block.timestamp, batchDuration);
    }

    /// @notice Aggregate orders into tick buckets
    /// @param batchId Batch to aggregate
    function _aggregateOrdersToTicks(uint256 batchId) internal {
        uint256[] memory orderIds = batchOrders[batchId];

        for (uint256 i = 0; i < orderIds.length; i++) {
            Order memory order = orders[orderIds[i]];
            
            // Add order to tick aggregates
            bool isBuy = order.orderType == OrderType.Buy;
            _addToTick(isBuy, order.limitPrice, order.size);
        }
    }

    /// @notice Execute a trade by transferring tokens
    /// @param order Order to execute
    /// @param clearingTick Clearing price tick
    function _executeTrade(Order memory order, uint256 clearingTick) internal {
        // Calculate trade amounts
        // For Phase 1 (all-or-nothing), full size is traded at clearing price
        uint256 clearingPrice = tickToPrice(clearingTick);
        
        // NOTE: This is simplified - actual implementation needs:
        // 1. Encrypted multiplication: tradeValue = size * clearingPrice
        // 2. Token transfers using MockConfidentialToken.transferFrom()
        // 3. Proper collateral/escrow management
        
        // Placeholder for token transfer logic
        // if (order.orderType == OrderType.Buy) {
        //     // Transfer quote tokens from buyer to seller
        //     // Transfer base tokens from seller to buyer
        // } else {
        //     // Transfer base tokens from seller to buyer
        //     // Transfer quote tokens from buyer to seller
        // }
    }

    /// @notice Get batch orders
    /// @param batchId Batch ID
    /// @return orderIds Array of order IDs in batch
    function getBatchOrders(uint256 batchId) external view returns (uint256[] memory) {
        return batchOrders[batchId];
    }

    // Temporary mock for FHE.decrypt (Removed in fhevm >= 0.4)
    function _mockDecrypt(ebool value) internal view returns (bool) {
        return ebool.unwrap(value) != bytes32(0);
    }
}
