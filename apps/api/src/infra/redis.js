"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.isRedisInMemory = isRedisInMemory;
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = require("../config/env.js");
const pino_js_1 = require("../shared/logger/pino.js");
class InMemoryRedisMock {
    store = new Map();
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ...args) {
        let expiry;
        if (args[0] === 'EX' && typeof args[1] === 'number') {
            expiry = Date.now() + args[1] * 1000;
        }
        else if (args[0] === 'PX' && typeof args[1] === 'number') {
            expiry = Date.now() + args[1];
        }
        this.store.set(key, { value, expiry });
        return 'OK';
    }
    async del(...keys) {
        let count = 0;
        for (const key of keys) {
            if (this.store.delete(key))
                count++;
        }
        return count;
    }
    async incr(key) {
        const current = await this.get(key);
        const num = (current ? parseInt(current, 10) : 0) + 1;
        const item = this.store.get(key);
        this.store.set(key, { value: num.toString(), expiry: item?.expiry });
        return num;
    }
    async expire(key, seconds) {
        const item = this.store.get(key);
        if (!item)
            return 0;
        item.expiry = Date.now() + seconds * 1000;
        this.store.set(key, item);
        return 1;
    }
    async ping() {
        return 'PONG';
    }
    async quit() {
        this.store.clear();
        return 'OK';
    }
}
let redisInstance = null;
let isInMemoryFallback = false;
function getRedisClient() {
    if (!redisInstance) {
        try {
            const client = new ioredis_1.default(env_js_1.config.REDIS_URL, {
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 2) {
                        return null; // Stop retrying, allow fallback
                    }
                    return Math.min(times * 100, 1000);
                },
                lazyConnect: true,
            });
            client.on('error', (err) => {
                if (!isInMemoryFallback) {
                    pino_js_1.logger.warn({ err: err.message }, 'Redis connection error, activating resilient in-memory fallback');
                    isInMemoryFallback = true;
                    redisInstance = new InMemoryRedisMock();
                }
            });
            client.connect().catch(() => {
                pino_js_1.logger.warn('Redis unavailable on start, using in-memory fallback cache');
                isInMemoryFallback = true;
                redisInstance = new InMemoryRedisMock();
            });
            redisInstance = client;
        }
        catch {
            pino_js_1.logger.warn('Redis client initialization failed, using in-memory fallback cache');
            isInMemoryFallback = true;
            redisInstance = new InMemoryRedisMock();
        }
    }
    return redisInstance;
}
function isRedisInMemory() {
    return isInMemoryFallback;
}
//# sourceMappingURL=redis.js.map