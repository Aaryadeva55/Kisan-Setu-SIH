import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'notification-worker' });
const prisma = new PrismaClient();

export async function notificationProcessor(job: Job) {
  const { userId, title, body, channel } = job.data;
  logger.info({ jobId: job.id, userId, title }, 'Processing notification job');

  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
      channel: channel || 'IN_APP',
      status: 'PENDING',
    },
  });
}
