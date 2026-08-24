import { Router } from 'express';
import { buyersController } from './buyers.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { createRequirementSchema, updateRequirementSchema } from './buyers.validator.js';
import { Role } from '@kisan-setu/types';

const router = Router();

// Admin / FPO list buyers
router.get('/', requireAuth, requireRole(Role.ADMIN, Role.GOVERNMENT_EVALUATOR, Role.FPO), buyersController.listBuyers);

// Buyer Requirements
router.post(
  '/requirements',
  requireAuth,
  requireRole(Role.BUYER),
  validate(createRequirementSchema),
  buyersController.createRequirement
);

router.get('/requirements', requireAuth, buyersController.listRequirements);

router.patch(
  '/requirements/:id',
  requireAuth,
  requireRole(Role.BUYER),
  validate(updateRequirementSchema),
  buyersController.updateRequirement
);

router.delete(
  '/requirements/:id',
  requireAuth,
  requireRole(Role.BUYER, Role.ADMIN),
  buyersController.deactivateRequirement
);

export default router;
