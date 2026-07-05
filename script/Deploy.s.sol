// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/core/BatchAuctionDEX.sol";
import "../src/mocks/MockConfidentialToken.sol";

/// @title Deploy Script for FBA DEX
/// @notice Deploys the Batch Auction DEX and mock tokens to Sepolia testnet
contract Deploy is Script {
    // Deployment parameters (can be overridden via environment variables)
    uint256 constant BATCH_DURATION = 5 minutes;  // 5-minute batches for testing

    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from address:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Base Token (e.g., cUSDC)
        console.log("\n=== Deploying Mock Base Token ===");
        MockConfidentialToken baseToken = new MockConfidentialToken(
            "Confidential USDC",
            "cUSDC"
        );
        console.log("Base Token deployed at:", address(baseToken));

        // 2. Deploy Mock Quote Token (e.g., cDAI)
        console.log("\n=== Deploying Mock Quote Token ===");
        MockConfidentialToken quoteToken = new MockConfidentialToken(
            "Confidential DAI",
            "cDAI"
        );
        console.log("Quote Token deployed at:", address(quoteToken));

        // 3. Deploy BatchAuctionDEX
        console.log("\n=== Deploying BatchAuctionDEX ===");
        BatchAuctionDEX dex = new BatchAuctionDEX(
            deployer,                  // keeper (deployer for testing)
            address(baseToken),        // base token
            address(quoteToken),       // quote token
            BATCH_DURATION            // batch duration
        );
        console.log("BatchAuctionDEX deployed at:", address(dex));

        // 4. Mint test tokens to deployer
        console.log("\n=== Minting Test Tokens ===");
        baseToken.mint(deployer, 1_000_000e18);   // 1M base tokens
        quoteToken.mint(deployer, 1_000_000e18);  // 1M quote tokens
        console.log("Minted 1M of each token to deployer");

        vm.stopBroadcast();

        // Output deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:          Sepolia");
        console.log("Deployer:        ", deployer);
        console.log("Base Token:      ", address(baseToken));
        console.log("Quote Token:     ", address(quoteToken));
        console.log("DEX Contract:    ", address(dex));
        console.log("Batch Duration:  ", BATCH_DURATION, "seconds");
        console.log("Keeper:          ", deployer);
        
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on Etherscan:");
        console.log("   forge verify-contract", address(baseToken), "src/mocks/MockConfidentialToken.sol:MockConfidentialToken");
        console.log("   forge verify-contract", address(quoteToken), "src/mocks/MockConfidentialToken.sol:MockConfidentialToken");
        console.log("   forge verify-contract", address(dex), "src/core/BatchAuctionDEX.sol:BatchAuctionDEX");
        console.log("\n2. Update frontend config with deployed addresses");
        console.log("\n3. Start keeper bot with DEX address:", address(dex));
    }
}
