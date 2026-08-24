import { farmersRepository } from './farmers.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { matchingService } from '../matching/matching.service.js';

export class FarmersService {
  async listFarmers(districtId?: string, search?: string, page = 1, pageSize = 20) {
    const { total, data } = await farmersRepository.listAll(districtId, search, page, pageSize);
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

  async getFarmerProfile(id: string) {
    const farmer = await farmersRepository.findById(id);
    if (!farmer) {
      throw new NotFoundError('FarmerProfile');
    }
    return farmer;
  }

  async getAdvisories(id: string) {
    await this.getFarmerProfile(id); // verify exists
    return farmersRepository.getAdvisories(id);
  }

  async getSellIntents(id: string) {
    await this.getFarmerProfile(id); // verify exists
    return farmersRepository.getSellIntents(id);
  }

  async createSellIntent(data: {
    farmerId: string;
    cropId: string;
    quantityKg: number;
    expectedPrice?: number;
    harvestDate?: Date;
  }) {
    const profile = await this.getFarmerProfile(data.farmerId);
    const sellIntent = await farmersRepository.createSellIntent({
      ...data,
      farmerId: profile.id,
    });

    // Asynchronously or immediately compute matches
    try {
      await matchingService.runMatchingForSellIntent(sellIntent.id);
    } catch {
      // Degrade gracefully if matching triggers async queue
    }

    return sellIntent;
  }
}

export const farmersService = new FarmersService();
