import { Worker } from 'bullmq';
import { config } from '@kisan-setu/config';
import { QUEUE_NAMES } from '@kisan-setu/types';
import { priceIngestionProcessor } from './processors/price-ingestion.processor.js';
import { weatherIngestionProcessor } from './processors/weather-ingestion.processor.js';
import { matchingProcessor } from './processors/matching.processor.js';
import { notificationProcessor } from './processors/notification.processor.js';
import { whatsappProcessor } from './processors/whatsapp.processor.js';
import { cleanupProcessor } from './processors/cleanup.processor.js';
import pino from 'pino';

const logger = pino({ name: 'kisan-setu-worker' });

const redisConnection = {
  url: config.REDIS_URL,
  maxRetriesPerRequest: null,
};

function createSafeWorker(queueName: string, processor: any, concurrency = 2) {
  try {
    const worker = new Worker(queueName, processor, {
      connection: redisConnection,
      concurrency,
    });

    worker.on('completed', (job) => {
      logger.info({ queueName, jobId: job.id }, 'Job completed successfully');
    });

    worker.on('failed', (job, err) => {
      logger.error({ queueName, jobId: job?.id, err: err.message }, 'Job failed');
    });

    worker.on('error', (err) => {
      logger.warn({ queueName, err: err.message }, 'Worker connection error (safe fallback mode)');
    });

    return worker;
  } catch (err: any) {
    logger.warn({ queueName, err: err.message }, 'Could not bind live worker to Redis (offline/test mode)');
    return null;
  }
}

export function startWorkers() {
  logger.info('🚀 Starting Kisan Setu background workers...');

  const workers = [
    createSafeWorker(QUEUE_NAMES.PRICE_INGESTION, priceIngestionProcessor, 1),
    createSafeWorker(QUEUE_NAMES.WEATHER_INGESTION, weatherIngestionProcessor, 1),
    createSafeWorker(QUEUE_NAMES.BUYER_MATCHING, matchingProcessor, 3),
    createSafeWorker(QUEUE_NAMES.NOTIFICATIONS, notificationProcessor, 5),
    createSafeWorker(QUEUE_NAMES.WHATSAPP, whatsappProcessor, 5),
    createSafeWorker(QUEUE_NAMES.CLEANUP, cleanupProcessor, 1),
  ].filter(Boolean);

  logger.info({ activeWorkerCount: workers.length }, 'Worker processes initialized');
  return workers;
}

if (process.env.NODE_ENV !== 'test') {
  startWorkers();
}
