import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';
import { logger } from '../shared/logger/pino.js';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    if (process.env.NODE_ENV === 'development') {
      (prismaInstance as any).$on('query', (e: any) => {
        logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma query');
      });
    }
  }

  return prismaInstance;
}

export const prisma = getPrismaClient();
