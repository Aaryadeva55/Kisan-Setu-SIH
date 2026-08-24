import { Queue } from 'bullmq';
export declare const QUEUE_NAMES: {
    readonly PRICE_INGESTION: "price-ingestion";
    readonly WEATHER_INGESTION: "weather-ingestion";
    readonly RECOMMENDATIONS: "recommendations";
    readonly BUYER_MATCHING: "buyer-matching";
    readonly NOTIFICATIONS: "notifications";
    readonly WHATSAPP: "whatsapp";
    readonly CLEANUP: "cleanup";
};
declare class MockQueue {
    name: string;
    constructor(name: string);
    add(name: string, data: any, _opts?: any): Promise<{
        id: string;
        name: string;
        data: any;
    }>;
    getWaitingCount(): Promise<number>;
    getActiveCount(): Promise<number>;
    getFailedCount(): Promise<number>;
    getCompletedCount(): Promise<number>;
}
export declare function getQueue(queueName: string): Queue | MockQueue;
export {};
//# sourceMappingURL=index.d.ts.map