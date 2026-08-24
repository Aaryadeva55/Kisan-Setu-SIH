import { prisma } from '../../infra/prisma.js';

export class MatchingRepository {
  async getSellIntentById(id: string) {
    return prisma.sellIntent.findUnique({
      where: { id },
      include: {
        farmer: { include: { district: true } },
        crop: true,
      },
    });
  }

  async getBuyerRequirementById(id: string) {
    return prisma.buyerRequirement.findUnique({
      where: { id },
      include: {
        buyer: true,
        crop: true,
      },
    });
  }

  async findMatchingRequirementsForIntent(cropId: string) {
    return prisma.buyerRequirement.findMany({
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

  async findMatchingIntentsForRequirement(cropId: string) {
    return prisma.sellIntent.findMany({
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

  async upsertMatch(data: {
    sellIntentId: string;
    buyerRequirementId: string;
    score: number;
    scoreBreakdown: any;
  }) {
    return prisma.match.upsert({
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

  async getCandidatesForSellIntent(sellIntentId: string, minScore = 0.4) {
    return prisma.match.findMany({
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

export const matchingRepository = new MatchingRepository();
