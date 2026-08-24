import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const overview = await adminService.getOverviewMetrics(days);
      return res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const districtId = req.query.districtId as string | undefined;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const analytics = await adminService.getAnalytics(districtId, days);
      return res.status(200).json(analytics);
    } catch (err) {
      next(err);
    }
  }

  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await adminService.getSystemHealth();
      return res.status(200).json(health);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
