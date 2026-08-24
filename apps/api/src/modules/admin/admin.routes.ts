import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get(
  '/overview',
  requireAuth,
  requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR),
  adminController.getOverview
);

router.get(
  '/analytics',
  requireAuth,
  requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR),
  adminController.getAnalytics
);

router.get(
  '/system-health',
  requireAuth,
  requireRole(Role.ADMIN),
  adminController.getSystemHealth
);

export default router;
