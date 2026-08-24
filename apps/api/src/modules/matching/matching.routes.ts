import { Router } from 'express';
import { matchingController } from './matching.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.post('/run', requireAuth, matchingController.runMatchScan);
router.get('/:sellIntentId/candidates', requireAuth, matchingController.getCandidates);

export default router;
