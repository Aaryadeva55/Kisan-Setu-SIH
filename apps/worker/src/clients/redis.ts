import { Redis } from 'ioredis';
import { config } from '@kisan-setu/config';

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

  async ping(): Promise<string> {
    return 'PONG';
  }
}

let redisInstance: any = null;

export function getRedisClient(): any {
  if (!redisInstance) {
    try {
      const client = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        lazyConnect: true,
      });

      client.connect().catch(() => {
        redisInstance = new InMemoryRedisMock();
      });

      redisInstance = client;
    } catch {
      redisInstance = new InMemoryRedisMock();
    }
  }

  return redisInstance;
}
