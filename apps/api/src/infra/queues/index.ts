import { Queue } from 'bullmq';
import { config } from '../../config/env.js';
import { logger } from '../../shared/logger/pino.js';

export const QUEUE_NAMES = {
  PRICE_INGESTION: 'price-ingestion',
  WEATHER_INGESTION: 'weather-ingestion',
  RECOMMENDATIONS: 'recommendations',
  BUYER_MATCHING: 'buyer-matching',
  NOTIFICATIONS: 'notifications',
  WHATSAPP: 'whatsapp',
  CLEANUP: 'cleanup',
} as const;

const queues: Map<string, any> = new Map();

class MockQueue {
  constructor(public name: string) {}

  async add(name: string, data: any, _opts?: any) {
    logger.debug({ queue: this.name, job: name, data }, 'MockQueue job enqueued (in-memory)');
    return { id: `mock_job_${Date.now()}`, name, data };
  }

  async getWaitingCount() {
    return 0;
  }

  async getActiveCount() {
    return 0;
  }

  async getFailedCount() {
    return 0;
  }

  async getCompletedCount() {
    return 0;
  }
}

export function getQueue(queueName: string): Queue | MockQueue {
  if (queues.has(queueName)) {
    return queues.get(queueName)!;
  }

  try {
    const queue = new Queue(queueName, {
      connection: {
        url: config.REDIS_URL,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    });

    queue.on('error', (err) => {
      logger.warn({ queueName, err: err.message }, 'Queue error, falling back to mock producer');
    });

    queues.set(queueName, queue);
    return queue;
  } catch {
    const mock = new MockQueue(queueName);
    queues.set(queueName, mock);
    return mock;
  }
}
