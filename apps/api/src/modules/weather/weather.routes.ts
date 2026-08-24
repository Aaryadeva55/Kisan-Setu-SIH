import { Router } from 'express';
import { weatherController } from './weather.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get('/:districtId/latest', weatherController.getLatest);
router.get(
  ('/:districtId/history'),
  requireAuth,
  requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR),
  weatherController.getHistory
);

export default router;
