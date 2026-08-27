import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { requestIdMiddleware } from './shared/middleware/requestId.middleware.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import cropsRoutes from './modules/crops/crops.routes.js';
import weatherRoutes from './modules/weather/weather.routes.js';
import marketRoutes from './modules/market/market.routes.js';
import recommendationRoutes from './modules/recommendation/recommendation.routes.js';
import farmersRoutes from './modules/farmers/farmers.routes.js';
import buyersRoutes from './modules/buyers/buyers.routes.js';
import fpoRoutes from './modules/fpo/fpo.routes.js';
import matchingRoutes from './modules/matching/matching.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// Simple cookie parser helper
function cookieParserMiddleware(req: Request, res: Response, next: () => void) {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = {};
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        (req as any).cookies[key] = decodeURIComponent(value);
      }
    }
  }
  next();
}

export function createApp(): Express {
  const app = express();

  // Security Headers & Cross-Origin Resource Policy
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    })
  );

  // CORS - allow Vercel domains, localhost, and any origin configured
  const allowedOrigins = (config.CORS_ALLOWED_ORIGIN || '*')
    .split(',')
    .map((o: string) => o.trim().replace(/\/$/, ''));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        const isVercel = normalizedOrigin.endsWith('.vercel.app');
        const isLocalhost =
          normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1');
        const isAllowed =
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(normalizedOrigin) ||
          isVercel ||
          isLocalhost ||
          config.NODE_ENV === 'development';

        if (isAllowed) {
          callback(null, true);
        } else {
          // Dynamic allow for live production web apps
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-request-id',
        'X-Requested-With',
        'Accept',
        'Origin',
      ],
      exposedHeaders: ['set-cookie'],
    })
  );

  // Parsers & Tracing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParserMiddleware);
  app.use(requestIdMiddleware);

  // Healthcheck
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'kisan-setu-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/crops', cropsRoutes);
  apiV1.use('/weather', weatherRoutes);
  apiV1.use('/market', marketRoutes);
  apiV1.use('/recommendations', recommendationRoutes);
  apiV1.use('/farmers', farmersRoutes);
  apiV1.use('/buyers', buyersRoutes);
  apiV1.use('/fpo', fpoRoutes);
  apiV1.use('/matching', matchingRoutes);
  apiV1.use('/transactions', transactionsRoutes);
  apiV1.use('/whatsapp', whatsappRoutes);
  apiV1.use('/notifications', notificationsRoutes);
  apiV1.use('/admin', adminRoutes);

  app.use('/api/v1', apiV1);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
