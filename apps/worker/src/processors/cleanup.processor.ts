import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'cleanup-worker' });
const prisma = new PrismaClient();

export async function cleanupProcessor(job: Job) {
  logger.info({ jobId: job.id }, 'Running daily database cleanup job');

  // Deactivate requirements older than 60 days if empty
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const updated = await prisma.buyerRequirement.updateMany({
    where: {
      createdAt: { lt: sixtyDaysAgo },
      quantityKg: { lte: 0 },
      isActive: true,
    },
    data: { isActive: false },
  });

  logger.info({ deactivatedCount: updated.count }, 'Cleanup completed');
  return { deactivatedRequirements: updated.count };
}
