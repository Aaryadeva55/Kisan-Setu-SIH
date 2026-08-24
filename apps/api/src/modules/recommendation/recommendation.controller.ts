import { Request, Response, NextFunction } from 'express';
import { recommendationService } from './recommendation.service.js';

export class RecommendationController {
  async generateAdvisory(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = req.body.farmerId || req.user?.userId;
      const cropId = req.body.cropId as string | undefined;

      if (!farmerId) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'farmerId is required' },
        });
      }

      const advisories = await recommendationService.generateAdvisoryForFarmer(farmerId, cropId);
      return res.status(200).json({ advisories });
    } catch (err) {
      next(err);
    }
  }

  async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const { farmerId } = req.params;
      const advisories = await recommendationService.getLatestAdvisories(farmerId);
      return res.status(200).json({ advisories });
    } catch (err) {
      next(err);
    }
  }
}

export const recommendationController = new RecommendationController();
