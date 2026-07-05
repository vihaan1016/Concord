import { createPublicClient, http, type PublicClient } from 'viem';
import { config } from '../config.js';
import { logger } from '../logger.js';

/** Shared read-only viem client for the target chain. */
export const publicClient: PublicClient = createPublicClient({
  transport: http(config.RPC_URL),
});

/**
 * Start watching BatchAuctionDEX events and fold them into the store + socket feed.
 *
 * Phase 0: no-op skeleton so the server boots. Phase 4 wires
 * `publicClient.watchContractEvent` for OrderSubmitted / BatchOpened / BatchClosed /
 * ClearingPending / BatchCleared / OrderFilled / BatchSettled.
 *
 * @returns an unwatch function for graceful shutdown.
 */
export function startChainWatcher(): () => void {
  if (config.DEX_ADDRESS === '0x0000000000000000000000000000000000000000') {
    logger.warn('DEX_ADDRESS not set — chain watcher idle (set it to start indexing)');
    return () => {};
  }
  logger.info('chain watcher starting', { dex: config.DEX_ADDRESS, chainId: config.CHAIN_ID });
  // Phase 4: register event watchers here.
  return () => {};
}
