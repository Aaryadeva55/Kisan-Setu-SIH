import { Request, Response, NextFunction } from 'express';
import { farmersService } from './farmers.service.js';

export class FarmersController {
  async listFarmers(req: Request, res: Response, next: NextFunction) {
    try {
      const districtId = req.query.districtId as string | undefined;
      const search = req.query.q as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      const result = await farmersService.listFarmers(districtId, search, page, pageSize);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getFarmerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const farmer = await farmersService.getFarmerProfile(id);
      return res.status(200).json({ farmer });
    } catch (err) {
      next(err);
    }
  }

  async getAdvisories(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const advisories = await farmersService.getAdvisories(id);
      return res.status(200).json({ advisories });
    } catch (err) {
      next(err);
    }
  }

  async getSellIntents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sellIntents = await farmersService.getSellIntents(id);
      return res.status(200).json({ sellIntents });
    } catch (err) {
      next(err);
    }
  }

  async createSellIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { cropId, quantityKg, expectedPrice, harvestDate } = req.body;
      const sellIntent = await farmersService.createSellIntent({
        farmerId: id,
        cropId,
        quantityKg: parseFloat(quantityKg),
        expectedPrice: expectedPrice ? parseFloat(expectedPrice) : undefined,
        harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      });
      return res.status(201).json({ sellIntent });
    } catch (err) {
      next(err);
    }
  }
}

export const farmersController = new FarmersController();
