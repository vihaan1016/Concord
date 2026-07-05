// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@fhevm-solidity-0.11.1/lib/FHE.sol";

/// @title IBatchAuction
/// @notice Interface for the Sealed-Bid Batch Auction DEX
/// @dev Defines the public API for batch auction interactions
interface IBatchAuction {
    /// @notice Batch lifecycle states
    enum BatchStatus {
        Open,           // Accepting orders
        Closed,         // No new orders, clearing in progress
        Cleared,        // Clearing price determined
        Settled         // Transfers executed
    }

    /// @notice Order type (buy or sell)
    enum OrderType {
        Buy,
        Sell
    }

    /// @notice Encrypted order structure
    struct Order {
        address trader;
        OrderType orderType;
        euint64 size;           // Encrypted order size
        euint64 limitPrice;     // Encrypted limit price (in ticks)
        uint256 batchId;
        bool filled;
    }

    /// @notice Batch information
    struct Batch {
        uint256 batchId;
        uint256 startTime;
        uint256 endTime;
        BatchStatus status;
        uint256 clearingPrice;  // Plaintext clearing price (tick index)
        uint256 orderCount;
    }

    // Events
    event BatchOpened(uint256 indexed batchId, uint256 startTime, uint256 duration);
    event OrderSubmitted(
        uint256 indexed batchId, 
        uint256 indexed orderId, 
        address indexed trader,
        OrderType orderType
    );
    event BatchClosed(uint256 indexed batchId, uint256 timestamp);
    event BatchCleared(uint256 indexed batchId, uint256 clearingPrice, uint256 volume);
    event BatchSettled(uint256 indexed batchId, uint256 filledOrders);
    event OrderFilled(
        uint256 indexed batchId,
        uint256 indexed orderId,
        address indexed trader
    );

    /// @notice Submit an encrypted buy or sell order
    /// @param orderType Buy or Sell
    /// @param encryptedSize Encrypted order size (einput)
    /// @param encryptedPrice Encrypted limit price in ticks (einput)
    /// @param sizeProof Proof for encrypted size
    /// @param priceProof Proof for encrypted price
    /// @return orderId The unique order identifier
    function submitOrder(
        OrderType orderType,
        externalEuint64 encryptedSize,
        externalEuint64 encryptedPrice,
        bytes calldata sizeProof,
        bytes calldata priceProof
    ) external returns (uint256 orderId);

    /// @notice Close the current batch (keeper only)
    /// @dev Transitions batch from Open to Closed status
    function closeBatch() external;

    /// @notice Clear the batch (keeper only)
    /// @dev Computes clearing price using tick-based algorithm
    /// @param tickStart Starting tick index for clearing
    /// @param tickEnd Ending tick index for clearing
    function clearBatch(uint256 tickStart, uint256 tickEnd) external;

    /// @notice Settle the batch (keeper only)
    /// @dev Executes token transfers for filled orders
    /// @param startIndex Starting order index
    /// @param endIndex Ending order index
    function settleBatch(uint256 startIndex, uint256 endIndex) external;

    /// @notice Get current batch information
    /// @return Batch struct with current batch details
    function getCurrentBatch() external view returns (Batch memory);

    /// @notice Get order details
    /// @param orderId Order identifier
    /// @return Order struct
    function getOrder(uint256 orderId) external view returns (Order memory);

    /// @notice Check if an order was filled
    /// @param orderId Order identifier
    /// @return filled True if order was filled
    function isOrderFilled(uint256 orderId) external view returns (bool filled);
}
