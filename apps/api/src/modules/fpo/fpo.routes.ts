import { Router } from 'express';
import { fpoController } from './fpo.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { bundleTransactionSchema } from './fpo.validator.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get('/', requireAuth, requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR), fpoController.listFPOs);
router.get('/:id', requireAuth, fpoController.getFPODetail);
router.get('/:id/farmers', requireAuth, fpoController.getMemberFarmers);
router.get('/:id/demand', requireAuth, fpoController.getDemand);
router.post(
  '/:id/bundle-transaction',
  requireAuth,
  requireRole(Role.FPO, Role.ADMIN),
  validate(bundleTransactionSchema),
  fpoController.createBundleTransaction
);

export default router;
