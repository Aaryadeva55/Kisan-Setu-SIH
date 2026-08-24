import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, notificationsController.getNotifications);
router.patch('/:id/read', requireAuth, notificationsController.markRead);

export default router;
