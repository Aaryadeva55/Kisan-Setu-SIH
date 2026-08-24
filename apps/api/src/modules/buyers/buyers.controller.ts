import { Request, Response, NextFunction } from 'express';
import { buyersService } from './buyers.service.js';

export class BuyersController {
  async listBuyers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.q as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      const result = await buyersService.listBuyers(search, page, pageSize);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const requirement = await buyersService.createRequirement(req.user!.userId, req.body);
      return res.status(201).json({ requirement });
    } catch (err) {
      next(err);
    }
  }

  async listRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const isBuyer = req.user?.role === 'BUYER';
      const cropId = req.query.cropId as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const requirements = await buyersService.listRequirements(
        isBuyer ? req.user!.userId : undefined,
        cropId,
        isActive
      );

      return res.status(200).json({ requirements });
    } catch (err) {
      next(err);
    }
  }

  async updateRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requirement = await buyersService.updateRequirement(req.user!.userId, id, req.body);
      return res.status(200).json({ requirement });
    } catch (err) {
      next(err);
    }
  }

  async deactivateRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requirement = await buyersService.deactivateRequirement(req.user!.userId, id);
      return res.status(200).json({ requirement });
    } catch (err) {
      next(err);
    }
  }
}

export const buyersController = new BuyersController();
