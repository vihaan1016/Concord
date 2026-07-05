# FBA DEX Quick Reference

## 📦 Smart Contract Addresses (After Deployment)

```bash
# Set these after running deployment script
export DEX_ADDRESS=<address>
export BASE_TOKEN_ADDRESS=<address>
export QUOTE_TOKEN_ADDRESS=<address>
```

## 🔨 Development Commands

### Build & Test
```bash
# Compile contracts
forge build

# Run tests (requires FhevmTest setup)
forge test

# Run with verbose output
forge test -vvv

# Gas report
forge test --gas-report

# Test specific contract
forge test --match-contract BatchAuctionDEXTest

# Test specific function
forge test --match-test test_InitialState
```

### Deployment
```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY

# Dry run (no broadcast)
forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL
```

### Contract Verification
```bash
# Verify on Etherscan
forge verify-contract \
    <CONTRACT_ADDRESS> \
    src/core/BatchAuctionDEX.sol:BatchAuctionDEX \
    --chain sepolia \
    --etherscan-api-key $ETHERSCAN_API_KEY
```

## 📐 Contract Architecture

### BatchAuctionDEX
- **Purpose**: Main auction contract
- **Key Functions**:
  - `submitOrder(OrderType, externalEuint64, externalEuint64, bytes, bytes)` - Submit encrypted order
  - `closeBatch()` - Close current batch (keeper only)
  - `clearBatch(uint256, uint256)` - Find clearing price (keeper only)
  - `settleBatch(uint256, uint256)` - Execute trades (keeper only)

### ClearingEngine
- **Purpose**: Tick-based price discovery
- **Configuration**:
  - Ticks: 0-999 (1000 total)
  - Price range: $0.01 - $100
  - Tick spacing: ~$0.099
- **Key Functions**:
  - `tickToPrice(uint256)` - Convert tick to price
  - `priceToTick(uint256)` - Convert price to tick
  - `findClearingPrice(uint256, uint256)` - Find equilibrium

### MockConfidentialToken
- **Purpose**: Test token with FHE balances
- **Key Functions**:
  - `mint(address, uint256)` - Mint tokens (testing)
  - `transfer(address, externalEuint64, bytes)` - Transfer encrypted amount
  - `balanceOf(address)` - Get encrypted balance
  - `balanceOfDecrypted(address)` - Get plaintext balance (testing)

## 🔑 Key Concepts

### Encrypted Types (FHEVM 0.11.1)
```solidity
euint64      // Encrypted unsigned 64-bit integer (on-chain)
externalEuint64  // Encrypted input from user (external)
ebool        // Encrypted boolean
```

### Input Conversion
```solidity
// Convert external encrypted input to on-chain encrypted value
euint64 amount = FHE.fromExternal(externalAmount, proof);
```

### FHE Operations
```solidity
FHE.add(a, b)      // Encrypted addition
FHE.sub(a, b)      // Encrypted subtraction
FHE.mul(a, b)      // Encrypted multiplication
FHE.le(a, b)       // Encrypted less than or equal (returns ebool)
FHE.ge(a, b)       // Encrypted greater than or equal
FHE.select(cond, a, b)  // Encrypted ternary
```

## ⚠️ Important Warnings

### Mock Decrypt Functions
```solidity
// ❌ NOT FOR PRODUCTION!
function _mockDecrypt(euint64 value) internal view returns (uint64) {
    return uint64(uint256(euint64.unwrap(value)));
}
```
- Only for local testing and gas estimation
- Does NOT perform real decryption
- Must use `Gateway.requestDecryption()` in production

### Gas Considerations
- Encrypted operations are ~100-1000x more expensive than plaintext
- Each FHE operation costs ~100k-500k gas
- Clearing 100 orders across 1000 ticks: ~50M-200M gas
- Consider multi-block clearing for large batches

### Security Notes
- All order sizes and prices are encrypted on-chain
- Only clearing price is revealed (after batch closes)
- Traders cannot see other orders until settlement
- Front-running is mathematically impossible

## 📊 Batch Lifecycle

```
1. OPEN
   └─> Users submit encrypted orders
       └─> submitOrder(type, encSize, encPrice, proofs)

2. CLOSED (after batchDuration)
   └─> Keeper calls closeBatch()
       └─> No more order submissions

3. CLEARED
   └─> Keeper calls clearBatch(tickStart, tickEnd)
       └─> Finds clearing price via tick aggregation

4. SETTLED
   └─> Keeper calls settleBatch(startIdx, endIdx)
       └─> Executes trades for filled orders
       └─> Opens new batch
```

## 🧪 Testing Checklist

- [ ] Deploy mock tokens
- [ ] Deploy BatchAuctionDEX
- [ ] Mint tokens to test accounts
- [ ] Submit buy orders with various prices
- [ ] Submit sell orders with various prices
- [ ] Wait for batch to expire
- [ ] Call closeBatch()
- [ ] Call clearBatch(0, 999)
- [ ] Call settleBatch(0, numOrders)
- [ ] Verify filled orders
- [ ] Check token balances

## 🐛 Common Issues

### "Source not found" errors
- Check remappings.txt
- Verify dependencies installed with `forge install`

### "call to non-contract address"
- Tests need to inherit from FhevmTest
- FHEVM precompiles must be etched

### "type(uint64).max" overflow
- Keep test balances under 10e18
- FHEVM euint64 cannot exceed uint64 max

### "only keeper" revert
- Ensure msg.sender == keeper address
- Check keeper is properly set in constructor

## 📚 Resources

- [FHEVM Docs](https://docs.zama.ai/fhevm)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Confidential Contracts](https://docs.openzeppelin.com/confidential-contracts)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com)

---

**Last Updated**: 2026-07-06  
**Foundry**: 1.5.1-stable  
**FHEVM**: 0.13.1 (fhevm-solidity 0.11.1)
