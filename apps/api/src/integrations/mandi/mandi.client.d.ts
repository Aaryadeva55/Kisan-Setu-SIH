export interface RawMandiPriceRecord {
    id: string;
    state: string;
    district: string;
    mandiName: string;
    cropName: string;
    min: number;
    max: number;
    modal: number;
    date: Date;
}
export declare class MandiApiClient {
    fetchLatest(): Promise<RawMandiPriceRecord[]>;
}
export declare const mandiApiClient: MandiApiClient;
//# sourceMappingURL=mandi.client.d.ts.map