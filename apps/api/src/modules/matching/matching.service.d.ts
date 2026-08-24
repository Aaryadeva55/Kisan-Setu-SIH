import { MatchScoreResult } from '@kisan-setu/types';
export declare class MatchingService {
    computeMatchScore(intent: any, requirement: any): Promise<MatchScoreResult>;
    runMatchingForSellIntent(sellIntentId: string): Promise<({
        sellIntent: {
            crop: {
                name: string;
                id: string;
                category: string | null;
                waterReq: string | null;
            };
            farmer: {
                id: string;
                districtId: string;
                latitude: number | null;
                longitude: number | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                fullName: string | null;
                taluka: string | null;
                village: string | null;
                landSizeAcres: number | null;
            };
        } & {
            id: string;
            status: string;
            cropId: string;
            createdAt: Date;
            farmerId: string;
            quantityKg: number;
            expectedPrice: number | null;
            harvestDate: Date | null;
        };
        buyerRequirement: {
            crop: {
                name: string;
                id: string;
                category: string | null;
                waterReq: string | null;
            };
            buyer: {
                id: string;
                createdAt: Date;
                userId: string;
                companyName: string;
                buyerType: string;
            };
        } & {
            id: string;
            districtId: string | null;
            cropId: string;
            maxPrice: number | null;
            createdAt: Date;
            isActive: boolean;
            deletedAt: Date | null;
            quantityKg: number;
            buyerId: string;
            minQuality: string | null;
            radiusKm: number | null;
        };
        transaction: {
            id: string;
            status: import("@prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            quantityKg: number;
            matchId: string;
            agreedPrice: number | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        sellIntentId: string;
        buyerRequirementId: string;
        score: number;
        scoreBreakdown: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    runMatchingForRequirement(requirementId: string): Promise<({
        sellIntent: {
            crop: {
                name: string;
                id: string;
                category: string | null;
                waterReq: string | null;
            };
            farmer: {
                id: string;
                districtId: string;
                latitude: number | null;
                longitude: number | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                fullName: string | null;
                taluka: string | null;
                village: string | null;
                landSizeAcres: number | null;
            };
        } & {
            id: string;
            status: string;
            cropId: string;
            createdAt: Date;
            farmerId: string;
            quantityKg: number;
            expectedPrice: number | null;
            harvestDate: Date | null;
        };
        buyerRequirement: {
            crop: {
                name: string;
                id: string;
                category: string | null;
                waterReq: string | null;
            };
            buyer: {
                id: string;
                createdAt: Date;
                userId: string;
                companyName: string;
                buyerType: string;
            };
        } & {
            id: string;
            districtId: string | null;
            cropId: string;
            maxPrice: number | null;
            createdAt: Date;
            isActive: boolean;
            deletedAt: Date | null;
            quantityKg: number;
            buyerId: string;
            minQuality: string | null;
            radiusKm: number | null;
        };
        transaction: {
            id: string;
            status: import("@prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            quantityKg: number;
            matchId: string;
            agreedPrice: number | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        sellIntentId: string;
        buyerRequirementId: string;
        score: number;
        scoreBreakdown: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    getCandidates(sellIntentId: string): Promise<({
        buyerRequirement: {
            crop: {
                name: string;
                id: string;
                category: string | null;
                waterReq: string | null;
            };
            buyer: {
                id: string;
                createdAt: Date;
                userId: string;
                companyName: string;
                buyerType: string;
            };
        } & {
            id: string;
            districtId: string | null;
            cropId: string;
            maxPrice: number | null;
            createdAt: Date;
            isActive: boolean;
            deletedAt: Date | null;
            quantityKg: number;
            buyerId: string;
            minQuality: string | null;
            radiusKm: number | null;
        };
        transaction: {
            id: string;
            status: import("@prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            quantityKg: number;
            matchId: string;
            agreedPrice: number | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        sellIntentId: string;
        buyerRequirementId: string;
        score: number;
        scoreBreakdown: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
}
export declare const matchingService: MatchingService;
//# sourceMappingURL=matching.service.d.ts.map