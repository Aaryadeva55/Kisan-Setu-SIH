"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = void 0;
exports.getQueue = getQueue;
const bullmq_1 = require("bullmq");
const env_js_1 = require("../../config/env.js");
const pino_js_1 = require("../../shared/logger/pino.js");
exports.QUEUE_NAMES = {
    PRICE_INGESTION: 'price-ingestion',
    WEATHER_INGESTION: 'weather-ingestion',
    RECOMMENDATIONS: 'recommendations',
    BUYER_MATCHING: 'buyer-matching',
    NOTIFICATIONS: 'notifications',
    WHATSAPP: 'whatsapp',
    CLEANUP: 'cleanup',
};
const queues = new Map();
class MockQueue {
    name;
    constructor(name) {
        this.name = name;
    }
    async add(name, data, _opts) {
        pino_js_1.logger.debug({ queue: this.name, job: name, data }, 'MockQueue job enqueued (in-memory)');
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
function getQueue(queueName) {
    if (queues.has(queueName)) {
        return queues.get(queueName);
    }
    try {
        const queue = new bullmq_1.Queue(queueName, {
            connection: {
                url: env_js_1.config.REDIS_URL,
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
            pino_js_1.logger.warn({ queueName, err: err.message }, 'Queue error, falling back to mock producer');
        });
        queues.set(queueName, queue);
        return queue;
    }
    catch {
        const mock = new MockQueue(queueName);
        queues.set(queueName, mock);
        return mock;
    }
}
//# sourceMappingURL=index.js.map