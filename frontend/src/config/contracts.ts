// ---------------------------------------------------------------------------
// FBA DEX contract config.
// Phase 0: placeholders so the app resolves. Phase 1 wires the real Sepolia
// addresses + ABIs (generated in ../../out/BatchAuctionDEX.sol/*.json).
// The legacy OmniCurve exports below are kept as empty placeholders until the
// prediction-market files that import them are removed in later phases.
// ---------------------------------------------------------------------------

export const CHAIN_ID = 11155111 // Ethereum Sepolia (Zama FHEVM)

export const DEX_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const BASE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const QUOTE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export const DEX_ABI = [] as const
export const CONFIDENTIAL_TOKEN_ABI = [] as const

// --- legacy placeholders (removed in Phase 5 with the market files) ---
export const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const USDC_ADDRESS = '0x0000000000000000000000000000000000000000' as const
export const AMM_ABI = [] as const
export const ROUTER_ABI = [] as const
export const FACTORY_ABI = [] as const

export const LP_TOKEN_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const
