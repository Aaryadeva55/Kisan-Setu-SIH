import { config } from '@kisan-setu/config';
import pino from 'pino';

const logger = pino({ name: 'worker-whatsapp-client' });

export class WhatsAppClient {
  async sendTextMessage(to: string, body: string): Promise<boolean> {
    logger.info({ to, bodyLength: body.length }, 'Worker sending WhatsApp message');

    if (config.DEMO_MODE || config.WHATSAPP_ACCESS_TOKEN === 'replace_me' || config.WHATSAPP_ACCESS_TOKEN === 'demo_access_token') {
      logger.info({ to, body }, 'DEMO_MODE: Worker simulated WhatsApp send success');
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body },
        }),
      });

      return res.ok;
    } catch (err) {
      logger.error({ err }, 'Worker WhatsApp Cloud API network exception');
      return false;
    }
  }
}

export const whatsappClient = new WhatsAppClient();
