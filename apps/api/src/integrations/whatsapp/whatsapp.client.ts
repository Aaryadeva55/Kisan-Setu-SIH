import crypto from 'crypto';
import { config } from '../../config/env.js';
import { logger } from '../../shared/logger/pino.js';

export interface WhatsAppMessagePayload {
  to: string;
  type: 'text' | 'interactive' | 'template';
  text?: { body: string };
  interactive?: any;
}

export class WhatsAppClient {
  get apiUrl(): string {
    const phoneId = config.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '1293140460550652';
    return `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  }

  get token(): string {
    return config.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  get appSecret(): string {
    return config.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '';
  }

  verifyWebhookSignature(signatureHeader: string | undefined, rawBody: string | Buffer): boolean {
    if (!signatureHeader) return false;
    if (config.DEMO_MODE || config.NODE_ENV === 'test') return true;

    try {
      const elements = signatureHeader.split('=');
      const signature = elements[1];
      const hmac = crypto.createHmac('sha256', this.appSecret);
      hmac.update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
      const digest = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch (err) {
      logger.warn({ err }, 'WhatsApp signature verification failed');
      return false;
    }
  }

  async sendTextMessage(to: string, body: string): Promise<boolean> {
    logger.info({ to, bodyLength: body.length }, 'Sending WhatsApp text message');

    if (config.DEMO_MODE || this.token === 'replace_me' || this.token === 'demo_access_token') {
      logger.info({ to, body }, 'DEMO_MODE: Simulated WhatsApp send success');
      return true;
    }

    try {
      // Clean phone number (strip leading + or non-numeric characters)
      const cleanTo = to.replace(/[^0-9]/g, '');

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { body },
        }),
      });

      const responseBody = await res.text();

      if (!res.ok) {
        logger.error({ status: res.status, responseBody }, 'WhatsApp Cloud API send failed');
        return false;
      }

      logger.info({ to: cleanTo, status: res.status }, 'WhatsApp text message successfully sent');
      return true;
    } catch (err) {
      logger.error({ err }, 'WhatsApp Cloud API network exception');
      return false;
    }
  }
}

export const whatsappClient = new WhatsAppClient();
