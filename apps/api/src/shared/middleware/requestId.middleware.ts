import { Request, Response, NextFunction } from 'express';
import { generateCuidLikeId } from '@kisan-setu/shared';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.header('x-request-id');
  const requestId = incomingId || generateCuidLikeId('req_');
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
