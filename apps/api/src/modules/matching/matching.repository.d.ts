export declare class MatchingRepository {
    getSellIntentById(id: string): Promise<({
        crop: {
            name: string;
            id: string;
            category: string | null;
            waterReq: string | null;
        };
        farmer: {
            district: {
                name: string;
                id: string;
                state: string;
            };
        } & {
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
    }) | null>;
    getBuyerRequirementById(id: string): Promise<({
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
    }) | null>;
    findMatchingRequirementsForIntent(cropId: string): Promise<({
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
    })[]>;
    findMatchingIntentsForRequirement(cropId: string): Promise<({
        crop: {
            name: string;
            id: string;
            category: string | null;
            waterReq: string | null;
        };
        farmer: {
            district: {
                name: string;
                id: string;
                state: string;
            };
        } & {
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
    })[]>;
    upsertMatch(data: {
        sellIntentId: string;
        buyerRequirementId: string;
        score: number;
        scoreBreakdown: any;
    }): Promise<{
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
    }>;
    getCandidatesForSellIntent(sellIntentId: string, minScore?: number): Promise<({
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
export declare const matchingRepository: MatchingRepository;
//# sourceMappingURL=matching.repository.d.ts.map