import { Router } from 'express';
import { marketController } from './market.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get('/prices/latest', marketController.getLatestPrice);
router.get(
  '/prices/history',
  requireAuth,
  requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR, Role.FPO, Role.BUYER),
  marketController.getPriceHistory
);

export default router;
