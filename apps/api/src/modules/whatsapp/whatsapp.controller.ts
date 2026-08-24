import { Request, Response, NextFunction } from 'express';
import { whatsappService } from './whatsapp.service.js';
import { whatsappClient } from '../../integrations/whatsapp/whatsapp.client.js';
import { config } from '../../config/env.js';
import { logger } from '../../shared/logger/pino.js';

export class WhatsAppController {
  verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook successfully verified');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden: invalid verification token');
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string | undefined;

      // Meta payload parsing
      const entry = req.body?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message) {
        const fromPhone = message.from;
        const externalMsgId = message.id;
        let messageText = '';

        if (message.type === 'text') {
          messageText = message.text?.body || '';
        } else if (message.type === 'interactive') {
          messageText =
            message.interactive?.button_reply?.id ||
            message.interactive?.list_reply?.id ||
            '';
        }

        if (fromPhone && messageText) {
          // Process message asynchronously/synchronously
          await whatsappService.handleInboundMessage({
            fromPhone,
            messageText,
            externalMsgId,
          });
        }
      }

      // Meta expects an immediate 200 OK
      return res.status(200).json({ status: 'received' });
    } catch (err) {
      logger.error({ err }, 'WhatsApp webhook processing error');
      // Return 200 to prevent repeated Meta webhook retries
      return res.status(200).json({ status: 'error_logged' });
    }
  }

  // Direct simulator endpoint for demo/testing
  async simulateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'phone and message are required' },
        });
      }

      const result = await whatsappService.handleInboundMessage({
        fromPhone: phone,
        messageText: message,
        externalMsgId: `sim_${Date.now()}`,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const whatsappController = new WhatsAppController();
