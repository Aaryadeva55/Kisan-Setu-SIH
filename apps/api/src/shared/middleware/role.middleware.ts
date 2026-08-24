import { Request, Response, NextFunction } from 'express';
import { Role } from '@kisan-setu/types';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User role '${req.user.role}' is not authorized for this resource.`
      );
    }

    next();
  };
}

export function allowRolesOrSelf(
  paramUserIdExtractor: (req: Request) => string | undefined,
  ...roles: Role[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const targetUserId = paramUserIdExtractor(req);
    const isSelf = targetUserId && req.user.userId === targetUserId;
    const hasRole = roles.includes(req.user.role);

    if (!isSelf && !hasRole) {
      throw new ForbiddenError();
    }

    next();
  };
}
