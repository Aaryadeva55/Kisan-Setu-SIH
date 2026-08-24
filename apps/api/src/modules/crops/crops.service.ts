import { cropsRepository } from './crops.repository.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

export class CropsService {
  async listCrops(category?: string) {
    return cropsRepository.listAll(category);
  }

  async getCropById(id: string) {
    const crop = await cropsRepository.findById(id);
    if (!crop) {
      throw new NotFoundError('Crop');
    }
    return crop;
  }

  async getCropSeasons(cropId: string) {
    await this.getCropById(cropId); // verify exists
    return cropsRepository.getSeasonsForCrop(cropId);
  }
}

export const cropsService = new CropsService();
