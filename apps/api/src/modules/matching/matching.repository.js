"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchingRepository = exports.MatchingRepository = void 0;
const prisma_js_1 = require("../../infra/prisma.js");
class MatchingRepository {
    async getSellIntentById(id) {
        return prisma_js_1.prisma.sellIntent.findUnique({
            where: { id },
            include: {
                farmer: { include: { district: true } },
                crop: true,
            },
        });
    }
    async getBuyerRequirementById(id) {
        return prisma_js_1.prisma.buyerRequirement.findUnique({
            where: { id },
            include: {
                buyer: true,
                crop: true,
            },
        });
    }
    async findMatchingRequirementsForIntent(cropId) {
        return prisma_js_1.prisma.buyerRequirement.findMany({
            where: {
                cropId,
                isActive: true,
                deletedAt: null,
            },
            include: {
                buyer: true,
                crop: true,
            },
        });
    }
    async findMatchingIntentsForRequirement(cropId) {
        return prisma_js_1.prisma.sellIntent.findMany({
            where: {
                cropId,
                status: 'OPEN',
            },
            include: {
                farmer: { include: { district: true } },
                crop: true,
            },
        });
    }
    async upsertMatch(data) {
        return prisma_js_1.prisma.match.upsert({
            where: {
                sellIntentId_buyerRequirementId: {
                    sellIntentId: data.sellIntentId,
                    buyerRequirementId: data.buyerRequirementId,
                },
            },
            update: {
                score: data.score,
                scoreBreakdown: data.scoreBreakdown,
            },
            create: {
                sellIntentId: data.sellIntentId,
                buyerRequirementId: data.buyerRequirementId,
                score: data.score,
                scoreBreakdown: data.scoreBreakdown,
            },
            include: {
                sellIntent: { include: { farmer: true, crop: true } },
                buyerRequirement: { include: { buyer: true, crop: true } },
                transaction: true,
            },
        });
    }
    async getCandidatesForSellIntent(sellIntentId, minScore = 0.4) {
        return prisma_js_1.prisma.match.findMany({
            where: {
                sellIntentId,
                score: { gte: minScore },
            },
            include: {
                buyerRequirement: { include: { buyer: true, crop: true } },
                transaction: true,
            },
            orderBy: { score: 'desc' },
        });
    }
}
exports.MatchingRepository = MatchingRepository;
exports.matchingRepository = new MatchingRepository();
//# sourceMappingURL=matching.repository.js.map