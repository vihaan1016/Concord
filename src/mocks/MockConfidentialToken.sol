// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@fhevm-solidity-0.11.1/lib/FHE.sol";
import "@fhevm-solidity-0.11.1/config/ZamaConfig.sol";

/// @title MockConfidentialToken
/// @notice Simple mock token for testing Phase 1.0 batch auction logic
/// @dev Uses FHE encrypted balances (euint64) for confidential transactions
contract MockConfidentialToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // Encrypted balances
    mapping(address => euint64) private balances;
    
    // Total supply (plaintext for testing convenience)
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to, uint256 amount);

    constructor(string memory _name, string memory _symbol) {
        // Initialize FHEVM with Zama config
        FHE.setCoprocessor(ZamaConfig.getEthereumCoprocessorConfig());
        
        name = _name;
        symbol = _symbol;
    }

    /// @notice Mint tokens to an address (testing only)
    /// @param to Recipient address
    /// @param amount Amount to mint (plaintext)
    function mint(address to, uint256 amount) external {
        require(to != address(0), "mint to zero address");
        require(amount <= type(uint64).max, "amount too large");

        // Convert plaintext to encrypted
        euint64 encryptedAmount = FHE.asEuint64(uint64(amount));
        
        // Add to balance
        balances[to] = FHE.add(balances[to], encryptedAmount);
        
        totalSupply += amount;
        
        emit Mint(to, amount);
    }

    /// @notice Transfer encrypted tokens
    /// @param to Recipient address
    /// @param encryptedAmount Encrypted amount to transfer
    /// @return success Whether the transfer succeeded
    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) 
        external 
        returns (bool success) 
    {
        require(to != address(0), "transfer to zero address");
        
        // Convert input to euint64
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Check sufficient balance
        ebool hasBalance = FHE.le(amount, balances[msg.sender]);
        require(_mockDecrypt(hasBalance), "insufficient balance");
        
        // Perform transfer
        balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
        balances[to] = FHE.add(balances[to], amount);
        
        emit Transfer(msg.sender, to);
        
        return true;
    }

    /// @notice Transfer from one address to another (for DEX)
    /// @param from Source address
    /// @param to Destination address
    /// @param amount Encrypted amount
    /// @return success Whether the transfer succeeded
    function transferFrom(address from, address to, euint64 amount) 
        external 
        returns (bool success) 
    {
        require(from != address(0), "transfer from zero address");
        require(to != address(0), "transfer to zero address");
        
        // Check sufficient balance
        ebool hasBalance = FHE.le(amount, balances[from]);
        require(_mockDecrypt(hasBalance), "insufficient balance");
        
        // Perform transfer
        balances[from] = FHE.sub(balances[from], amount);
        balances[to] = FHE.add(balances[to], amount);
        
        emit Transfer(from, to);
        
        return true;
    }

    /// @notice Get encrypted balance
    /// @param account Address to query
    /// @return Encrypted balance
    function balanceOf(address account) external view returns (euint64) {
        return balances[account];
    }

    /// @notice Decrypt and return balance (testing only - not secure!)
    /// @param account Address to query
    /// @return Decrypted balance
    function balanceOfDecrypted(address account) external view returns (uint64) {
        return _mockDecrypt(balances[account]);
    }

    // Temporary mock for FHE.decrypt (Removed in fhevm >= 0.4)
    function _mockDecrypt(ebool value) internal view returns (bool) {
        return ebool.unwrap(value) != bytes32(0);
    }
    
    function _mockDecrypt(euint64 value) internal view returns (uint64) {
        return uint64(uint256(euint64.unwrap(value)));
    }
}
