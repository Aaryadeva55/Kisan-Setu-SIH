import { Router } from 'express';
import { transactionsController } from './transactions.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { createTransactionSchema, updateStatusNoteSchema } from './transactions.validator.js';
import { Role } from '@kisan-setu/types';

const router = Router();

router.get('/', requireAuth, transactionsController.listTransactions);
router.get('/:id', requireAuth, transactionsController.getTransactionDetail);

router.post(
  '/',
  requireAuth,
  validate(createTransactionSchema),
  transactionsController.createTransaction
);

router.patch(
  '/:id/accept',
  requireAuth,
  requireRole(Role.BUYER, Role.ADMIN),
  validate(updateStatusNoteSchema),
  transactionsController.acceptTransaction
);

router.patch(
  '/:id/reject',
  requireAuth,
  requireRole(Role.BUYER, Role.ADMIN),
  validate(updateStatusNoteSchema),
  transactionsController.rejectTransaction
);

router.patch(
  '/:id/complete',
  requireAuth,
  requireRole(Role.BUYER, Role.FARMER, Role.FPO, Role.ADMIN),
  validate(updateStatusNoteSchema),
  transactionsController.completeTransaction
);

router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole(Role.FARMER, Role.FPO, Role.ADMIN),
  validate(updateStatusNoteSchema),
  transactionsController.cancelTransaction
);

export default router;
