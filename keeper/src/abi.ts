/** Minimal ABI for the keeper's interactions with BatchAuctionDEX. */
export const dexAbi = [
  {
    type: 'function',
    name: 'currentBatchId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MAX_TICK',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCurrentBatch',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'batchId', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'clearingPrice', type: 'uint256' },
          { name: 'matchedVolume', type: 'uint256' },
          { name: 'orderCount', type: 'uint256' },
          { name: 'nextTick', type: 'uint256' },
          { name: 'settleCursor', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getClearingHandles',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'volumeHandle', type: 'bytes32' },
      { name: 'tickHandle', type: 'bytes32' },
    ],
  },
  { type: 'function', name: 'closeBatch', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'clearBatchRange',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tickStart', type: 'uint256' },
      { name: 'tickEnd', type: 'uint256' },
    ],
    outputs: [],
  },
  { type: 'function', name: 'finalizeClearing', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'submitClearingResult',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'handles', type: 'bytes32[]' },
      { name: 'cleartexts', type: 'bytes' },
      { name: 'decryptionProof', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'settleBatchRange',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'startIndex', type: 'uint256' },
      { name: 'endIndex', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

/** Mirrors IBatchAuction.BatchStatus. */
export enum BatchStatus {
  Open = 0,
  Closed = 1,
  Clearing = 2,
  Cleared = 3,
  Settled = 4,
}
