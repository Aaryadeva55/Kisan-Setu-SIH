import { buyersRepository } from './buyers.repository.js';
import { matchingService } from '../matching/matching.service.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError.js';

export class BuyersService {
  async listBuyers(search?: string, page = 1, pageSize = 20) {
    const { total, data } = await buyersRepository.listAllBuyers(search, page, pageSize);
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

  async getBuyerByUserId(userId: string) {
    const buyer = await buyersRepository.findBuyerByUserId(userId);
    if (!buyer) {
      throw new NotFoundError('Buyer profile');
    }
    return buyer;
  }

  async createRequirement(
    userId: string,
    data: {
      cropId: string;
      quantityKg: number;
      maxPrice?: number;
      minQuality?: string;
      districtId?: string;
      radiusKm?: number;
    }
  ) {
    const buyer = await this.getBuyerByUserId(userId);
    const requirement = await buyersRepository.createRequirement({
      ...data,
      buyerId: buyer.id,
    });

    // Run matching asynchronously or immediately
    try {
      await matchingService.runMatchingForRequirement(requirement.id);
    } catch {
      // Degrade gracefully if matching engine is async
    }

    return requirement;
  }

  async listRequirements(userId?: string, cropId?: string, isActive?: boolean) {
    let buyerId: string | undefined;
    if (userId) {
      const buyer = await buyersRepository.findBuyerByUserId(userId);
      if (buyer) {
        buyerId = buyer.id;
      }
    }
    return buyersRepository.listRequirements(buyerId, cropId, isActive);
  }

  async updateRequirement(
    userId: string,
    requirementId: string,
    data: {
      quantityKg?: number;
      maxPrice?: number;
      minQuality?: string;
      districtId?: string;
      radiusKm?: number;
      isActive?: boolean;
    }
  ) {
    const buyer = await this.getBuyerByUserId(userId);
    const req = await buyersRepository.findRequirementById(requirementId);

    if (!req) {
      throw new NotFoundError('BuyerRequirement');
    }

    if (req.buyerId !== buyer.id) {
      throw new ForbiddenError('You do not own this requirement');
    }

    return buyersRepository.updateRequirement(requirementId, data);
  }

  async deactivateRequirement(userId: string, requirementId: string) {
    return this.updateRequirement(userId, requirementId, { isActive: false });
  }
}

export const buyersService = new BuyersService();
