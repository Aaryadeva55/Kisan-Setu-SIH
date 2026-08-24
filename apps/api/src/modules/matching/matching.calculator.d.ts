import { MatchScoreResult } from '@kisan-setu/types';
export declare function computeLocationScore(farmerDistrictId: string, buyerDistrictId?: string | null, radiusKm?: number | null, farmerCoords?: {
    lat?: number | null;
    lng?: number | null;
}, mandiCoords?: {
    lat?: number | null;
    lng?: number | null;
}): number;
export declare function computeQuantityScore(intentKg: number, reqKg: number): number;
export declare function computePriceScore(expectedPrice?: number | null, maxPrice?: number | null): number;
export declare function computeTimingScore(harvestDate?: Date | null, neededByDate?: Date | null): number;
export declare function scoreMatchPair(intent: any, req: any): MatchScoreResult;
//# sourceMappingURL=matching.calculator.d.ts.map