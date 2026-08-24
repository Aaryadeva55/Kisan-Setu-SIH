import { Job } from 'bullmq';
import { whatsappClient } from '../clients/whatsapp.client.js';
import pino from 'pino';

const logger = pino({ name: 'whatsapp-worker' });

export async function whatsappProcessor(job: Job) {
  const { to, message } = job.data;
  logger.info({ jobId: job.id, to }, 'Processing outbound WhatsApp job');

  const success = await whatsappClient.sendTextMessage(to, message);
  if (!success) {
    throw new Error(`Failed to dispatch WhatsApp message to ${to}`);
  }

  return { success: true };
}
