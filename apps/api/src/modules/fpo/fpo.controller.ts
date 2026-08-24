import { Request, Response, NextFunction } from 'express';
import { fpoService } from './fpo.service.js';

export class FPOController {
  async listFPOs(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.q as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      const result = await fpoService.listFPOs(search, page, pageSize);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getFPODetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const fpo = await fpoService.getFPODetail(id);
      return res.status(200).json({ fpo });
    } catch (err) {
      next(err);
    }
  }

  async getMemberFarmers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const farmers = await fpoService.getMemberFarmers(id);
      return res.status(200).json({ farmers });
    } catch (err) {
      next(err);
    }
  }

  async getDemand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const demand = await fpoService.getRelevantDemand(id);
      return res.status(200).json({ demand });
    } catch (err) {
      next(err);
    }
  }

  async createBundleTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { buyerRequirementId, sellIntentIds, agreedPrice } = req.body;

      const transaction = await fpoService.createBundleTransaction(
        id,
        buyerRequirementId,
        sellIntentIds,
        agreedPrice ? parseFloat(agreedPrice) : undefined
      );

      return res.status(201).json({ transaction });
    } catch (err) {
      next(err);
    }
  }
}

export const fpoController = new FPOController();
