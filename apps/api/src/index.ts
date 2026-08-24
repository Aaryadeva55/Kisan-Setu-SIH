import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './shared/logger/pino.js';
import { prisma } from './infra/prisma.js';
import { getRedisClient } from './infra/redis.js';

const PORT = config.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: config.NODE_ENV, prefix: '/api/v1' },
    `🚀 Kisan Setu API server listening on http://localhost:${PORT}`
  );
});

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully...');

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
    } catch (e) {
      logger.error({ err: e }, 'Error disconnecting Prisma');
    }

    try {
      const redis = getRedisClient();
      if (redis?.quit) {
        await redis.quit();
        logger.info('Redis client closed.');
      }
    } catch (e) {
      logger.error({ err: e }, 'Error closing Redis client');
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
