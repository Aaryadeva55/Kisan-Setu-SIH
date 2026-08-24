import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, JwtPayload } from '@kisan-setu/types';
import { config } from '../../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
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
  const token = extractBearerToken(req);
  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
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
