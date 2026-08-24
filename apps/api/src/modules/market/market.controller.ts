import { Request, Response, NextFunction } from 'express';
import { marketService } from './market.service.js';

export class MarketController {
  async getLatestPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const cropId = req.query.cropId as string;
      const districtId = req.query.districtId as string | undefined;
      const mandiId = req.query.mandiId as string | undefined;

      if (!cropId) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'cropId query parameter is required' },
        });
      }

      const price = await marketService.getLatestPrice(cropId, districtId, mandiId);
      return res.status(200).json({ price });
    } catch (err) {
      next(err);
    }
  }

  async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const cropId = req.query.cropId as string;
      const mandiId = req.query.mandiId as string | undefined;
      const districtId = req.query.districtId as string | undefined;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      if (!cropId) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'cropId query parameter is required' },
        });
      }

      const result = await marketService.getPriceHistory(cropId, mandiId, districtId, days);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const marketController = new MarketController();
