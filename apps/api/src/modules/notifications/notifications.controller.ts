import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationsService.getUserNotifications(req.user!.userId);
      return res.status(200).json({ notifications });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await notificationsService.markNotificationRead(id, req.user!.userId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
