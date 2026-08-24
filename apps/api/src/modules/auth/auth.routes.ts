import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { registerSchema, loginSchema } from './auth.validator.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { rateLimit } from '../../shared/middleware/rateLimiter.middleware.js';

const router = Router();

router.post(
  '/register',
  rateLimit({ windowSeconds: 60, maxRequests: 20 }),
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  rateLimit({ windowSeconds: 60, maxRequests: 30 }),
  validate(loginSchema),
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
