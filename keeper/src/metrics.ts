import http from 'node:http';
import { Registry, Counter, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from './logger.js';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const metrics = {
  batchesClosed: new Counter({
    name: 'fba_batches_closed_total',
    help: 'Number of batches closed by the keeper',
    registers: [registry],
  }),
  clearingTxs: new Counter({
    name: 'fba_clearing_txs_total',
    help: 'Number of clearBatchRange transactions sent',
    registers: [registry],
  }),
  batchesCleared: new Counter({
    name: 'fba_batches_cleared_total',
    help: 'Number of batches whose clearing result was submitted',
    registers: [registry],
  }),
  settleTxs: new Counter({
    name: 'fba_settle_txs_total',
    help: 'Number of settleBatchRange transactions sent',
    registers: [registry],
  }),
  batchesSettled: new Counter({
    name: 'fba_batches_settled_total',
    help: 'Number of batches fully settled',
    registers: [registry],
  }),
  errors: new Counter({
    name: 'fba_keeper_errors_total',
    help: 'Number of keeper errors',
    labelNames: ['stage'] as const,
    registers: [registry],
  }),
  currentBatchId: new Gauge({
    name: 'fba_current_batch_id',
    help: 'Current batch id observed by the keeper',
    registers: [registry],
  }),
  currentBatchStatus: new Gauge({
    name: 'fba_current_batch_status',
    help: 'Current batch status (0=Open,1=Closed,2=Clearing,3=Cleared,4=Settled)',
    registers: [registry],
  }),
};

/** Start a tiny HTTP server exposing /metrics for Prometheus to scrape. */
export function startMetricsServer(port: number): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } else if (req.url === '/health') {
      res.statusCode = 200;
      res.end('ok');
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  server.listen(port, () => logger.info(`metrics server listening on :${port}`));
}
