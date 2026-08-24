import { Router } from 'express';
import { farmersController } from './farmers.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get('/', requireAuth, requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR, Role.FPO), farmersController.listFarmers);
router.get('/:id', requireAuth, farmersController.getFarmerProfile);
router.get('/:id/advisories', requireAuth, farmersController.getAdvisories);
router.get('/:id/sell-intents', requireAuth, farmersController.getSellIntents);
router.post('/:id/sell-intents', requireAuth, farmersController.createSellIntent);

export default router;
