import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../logger/pino.js';
import { generateCuidLikeId } from '@kisan-setu/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const requestId = req.id || (req.header('x-request-id') as string) || generateCuidLikeId('err_');
  const childLogger = logger.child({ requestId, path: req.path, method: req.method });

  if (err instanceof AppError) {
    childLogger.warn(
      {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        details: err.details,
      },
      'Application handled error'
    );

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Handle Prisma Known Errors (like unique constraint violation P2002)
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: `Unique constraint violation on field(s): ${Array.isArray(target) ? target.join(', ') : target}`,
        requestId,
      },
    });
  }

  // Unhandled / Internal Server Error
  const errorId = generateCuidLikeId('unhandled_');
  childLogger.error(
    {
      errorId,
      err: {
        message: err.message,
        stack: err.stack,
      },
    },
    'Unhandled server error'
  );

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred',
      errorId,
      requestId,
    },
  });
}
