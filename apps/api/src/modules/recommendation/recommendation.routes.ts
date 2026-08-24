import { Router } from 'express';
import { recommendationController } from './recommendation.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, recommendationController.generateAdvisory);
router.get('/:farmerId/latest', requireAuth, recommendationController.getLatest);

export default router;
