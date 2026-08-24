import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../infra/redis.js';
import { AppError } from '../errors/AppError.js';

interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 100;
  const keyPrefix = options.keyPrefix || 'ratelimit';

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip =
        req.ip ||
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      const identifier = req.user?.userId ? `user:${req.user.userId}` : `ip:${ip}`;
      const route = req.baseUrl + req.path;
      const key = `${keyPrefix}:${identifier}:${route}`;

      const redis = getRedisClient();
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        throw new AppError(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded, please try again later');
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }
      // If redis rate limiting fails internally, degrade gracefully
      next();
    }
  };
}
