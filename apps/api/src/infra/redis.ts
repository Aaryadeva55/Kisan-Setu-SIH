import { Redis } from 'ioredis';
import { config } from '../config/env.js';
import { logger } from '../shared/logger/pino.js';

class InMemoryRedisMock {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    let expiry: number | undefined;
    if (args[0] === 'EX' && typeof args[1] === 'number') {
      expiry = Date.now() + args[1] * 1000;
    } else if (args[0] === 'PX' && typeof args[1] === 'number') {
      expiry = Date.now() + args[1];
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const num = (current ? parseInt(current, 10) : 0) + 1;
    const item = this.store.get(key);
    this.store.set(key, { value: num.toString(), expiry: item?.expiry });
    return num;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + seconds * 1000;
    this.store.set(key, item);
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

let redisInstance: any = null;
let isInMemoryFallback = false;

export function getRedisClient(): any {
  if (!redisInstance) {
    try {
      const client = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 2) {
            return null; // Stop retrying, allow fallback
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      client.on('error', (err: any) => {
        if (!isInMemoryFallback) {
          logger.warn({ err: err.message }, 'Redis connection error, activating resilient in-memory fallback');
          isInMemoryFallback = true;
          redisInstance = new InMemoryRedisMock();
        }
      });


      client.connect().catch(() => {
        logger.warn('Redis unavailable on start, using in-memory fallback cache');
        isInMemoryFallback = true;
        redisInstance = new InMemoryRedisMock();
      });

      redisInstance = client;
    } catch {
      logger.warn('Redis client initialization failed, using in-memory fallback cache');
      isInMemoryFallback = true;
      redisInstance = new InMemoryRedisMock();
    }
  }

  return redisInstance;
}

export function isRedisInMemory(): boolean {
  return isInMemoryFallback;
}
