import { fpoRepository } from './fpo.repository.js';
import { prisma } from '../../infra/prisma.js';
import { matchingService } from '../matching/matching.service.js';
import { TransactionStatus } from '@kisan-setu/types';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError.js';

export class FPOService {
  async listFPOs(search?: string, page = 1, pageSize = 20) {
    const { total, data } = await fpoRepository.listAll(search, page, pageSize);
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getFPODetail(id: string) {
    const fpo = await fpoRepository.findById(id);
    if (!fpo) {
      throw new NotFoundError('FPO');
    }
    return fpo;
  }

  async getMemberFarmers(fpoId: string) {
    return fpoRepository.getMemberFarmers(fpoId);
  }

  async getRelevantDemand(fpoId: string) {
    return fpoRepository.getDemandForFPO(fpoId);
  }

  async createBundleTransaction(
    fpoId: string,
    buyerRequirementId: string,
    sellIntentIds: string[],
    agreedPrice?: number
  ) {
    const requirement = await prisma.buyerRequirement.findUnique({
      where: { id: buyerRequirementId },
      include: { buyer: true },
    });

    if (!requirement || !requirement.isActive) {
      throw new NotFoundError('Active BuyerRequirement');
    }

    const sellIntents = await prisma.sellIntent.findMany({
      where: {
        id: { in: sellIntentIds },
        status: 'OPEN',
      },
      include: { farmer: true },
    });

    if (sellIntents.length === 0) {
      throw new ConflictError('No valid open sell intents found for bundling');
    }

    const totalQuantity = sellIntents.reduce((sum, s) => sum + s.quantityKg, 0);

    return prisma.$transaction(async (tx) => {
      // Pick or create a master match representation for the bundle
      const primaryIntent = sellIntents[0];
      const matchScore = await matchingService.computeMatchScore(primaryIntent, requirement);

      const match = await tx.match.upsert({
        where: {
          sellIntentId_buyerRequirementId: {
            sellIntentId: primaryIntent.id,
            buyerRequirementId: requirement.id,
          },
        },
        update: {
          score: matchScore.score,
          scoreBreakdown: matchScore.breakdown as any,
        },
        create: {
          sellIntentId: primaryIntent.id,
          buyerRequirementId: requirement.id,
          score: matchScore.score,
          scoreBreakdown: matchScore.breakdown as any,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          matchId: match.id,
          quantityKg: totalQuantity,
          agreedPrice: agreedPrice || requirement.maxPrice || primaryIntent.expectedPrice,
          status: TransactionStatus.REQUESTED,
        },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId: transaction.id,
          fromStatus: null,
          toStatus: TransactionStatus.REQUESTED,
          changedBy: `FPO:${fpoId}`,
          note: `Bundled transaction created with ${sellIntents.length} member farmers (${totalQuantity} kg total)`,
        },
      });

      // Mark all bundled sell intents as MATCHED
      await tx.sellIntent.updateMany({
        where: { id: { in: sellIntentIds } },
        data: { status: 'MATCHED' },
      });

      return transaction;
    });
  }
}

export const fpoService = new FPOService();
