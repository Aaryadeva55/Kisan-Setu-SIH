import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@kisan-setu/types';
import { config } from '../../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      cookies?: { [key: string]: string };
    }
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      phone: decoded.phone,
    };

    next();
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
      req.user = decoded;
    } catch {
      // Ignore errors for optional auth
    }
  }
  next();
}
