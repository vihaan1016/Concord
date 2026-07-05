import { encodePacked, type Hex } from 'viem';
import { logger } from './logger.js';

/**
 * Result of a public decryption, shaped for BatchAuctionDEX.submitClearingResult:
 * the contract calls FHE.checkSignatures(handles, cleartexts, decryptionProof).
 */
export interface PublicDecryptResult {
  cleartexts: Hex; // abi.encodePacked(uint256[]) matching `handles` order
  decryptionProof: Hex; // KMS public-decryption proof
  values: bigint[]; // decoded plaintext values, for logging/bookkeeping
}

/**
 * Off-chain public decryption of the clearing winner via the Zama relayer.
 *
 * The relayer SDK verifies KMS signatures and returns both the decrypted values and the
 * proof blob the on-chain KMSVerifier expects. We pack the values as uint256 words so the
 * contract can `abi.decode(cleartexts, (uint256, uint256))`.
 */
export async function publicDecrypt(
  relayerUrl: string,
  chainId: number,
  handles: Hex[],
): Promise<PublicDecryptResult> {
  // Loaded lazily so unit-level use of the keeper does not require the native SDK.
  const { createInstance } = await import('@zama-fhe/relayer-sdk/node');
  const instance = await createInstance({ chainId, relayerUrl } as never);

  logger.info('requesting public decryption', { handles });
  // Returns a map handle -> value plus the KMS proof material.
  const res: {
    values: Record<string, bigint | string>;
    proof: Hex;
  } = await (instance as unknown as {
    publicDecrypt: (h: Hex[]) => Promise<{ values: Record<string, bigint | string>; proof: Hex }>;
  }).publicDecrypt(handles);

  const values = handles.map((h) => BigInt(res.values[h] ?? res.values[h.toLowerCase()] ?? 0));
  const cleartexts = encodePacked(
    values.map(() => 'uint256'),
    values,
  ) as Hex;

  return { cleartexts, decryptionProof: res.proof, values };
}
