import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config, allowedOrigins } from './config.js';
import { logger } from './logger.js';
import { initSocket } from './sockets/socketManager.js';
import { startChainWatcher } from './services/chainService.js';
import healthRoutes from './routes/health.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'] }));
app.use(express.json());

app.use('/api', healthRoutes);
// Phase 4: app.use('/api/batches', batchRoutes); app.use('/api/users', userRoutes);

const httpServer = createServer(app);
initSocket(httpServer);

const unwatch = startChainWatcher();

httpServer.listen(config.PORT, () => {
  logger.info(`indexer listening on :${config.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`received ${signal}, shutting down`);
  unwatch();
  httpServer.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
