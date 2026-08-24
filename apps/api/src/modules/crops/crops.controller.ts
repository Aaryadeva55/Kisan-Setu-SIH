import { Request, Response, NextFunction } from 'express';
import { cropsService } from './crops.service.js';

export class CropsController {
  async listCrops(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const crops = await cropsService.listCrops(category);
      return res.status(200).json({ crops });
    } catch (err) {
      next(err);
    }
  }

  async getCropSeasons(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const seasons = await cropsService.getCropSeasons(id);
      return res.status(200).json({ seasons });
    } catch (err) {
      next(err);
    }
  }

  async getCropById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const crop = await cropsService.getCropById(id);
      return res.status(200).json({ crop });
    } catch (err) {
      next(err);
    }
  }
}

export const cropsController = new CropsController();
