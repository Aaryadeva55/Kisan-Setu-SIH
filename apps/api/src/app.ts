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

  // Global Request Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      // Don't clutter logs with periodic /health checks unless non-200
      if (req.path === '/health' && res.statusCode === 200) return;
      console.log(`📡 [${req.method}] ${req.originalUrl || req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  // Root & Policy Endpoints for Meta / App Verification
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Kisan Setu Platform API</title></head>
        <body style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
          <h1>🌾 Kisan Setu Platform API</h1>
          <p>AI-Powered Direct Farmer-to-Buyer Market Linkage Platform.</p>
          <p>Service is live and operating.</p>
          <ul>
            <li><a href="/health">Health Check</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/data-deletion">Data Deletion Instructions</a></li>
          </ul>
        </body>
      </html>
    `);
  });

  app.get('/privacy', (_req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Privacy Policy - Kisan Setu</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; line-height: 1.6;">
          <h1>Privacy Policy for Kisan Setu</h1>
          <p><strong>Effective Date:</strong> January 2026</p>
          <p>Kisan Setu ("we", "our") values the privacy of our users. This privacy policy explains how we handle your personal information when using our WhatsApp Bot and web platform.</p>
          <h3>1. Information We Collect</h3>
          <p>We collect phone numbers, district selections, and agricultural intent data provided by farmers and buyers to facilitate agricultural market linkage.</p>
          <h3>2. How We Use Information</h3>
          <p>We use this information solely to provide crop advisory recommendations, mandi commodity pricing, and direct buyer-farmer trade matching.</p>
          <h3>3. Contact</h3>
          <p>For questions or data inquiries, contact support@kisan-setu.org.</p>
        </body>
      </html>
    `);
  });

  app.get('/data-deletion', (_req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>User Data Deletion Instructions - Kisan Setu</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; line-height: 1.6;">
          <h1>User Data Deletion Instructions</h1>
          <p>Kisan Setu provides users full control over their data.</p>
          <p>To request deletion of your WhatsApp conversation history, farmer profile, or account data:</p>
          <ol>
            <li>Send an email to <strong>support@kisan-setu.org</strong> with the subject <em>"Data Deletion Request"</em>.</li>
            <li>Include your registered WhatsApp phone number.</li>
            <li>Or send the text <strong>"DELETE MY DATA"</strong> directly in the WhatsApp bot.</li>
          </ol>
          <p>All associated user profiles, messages, and transaction history will be purged within 48 hours.</p>
        </body>
      </html>
    `);
  });

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
