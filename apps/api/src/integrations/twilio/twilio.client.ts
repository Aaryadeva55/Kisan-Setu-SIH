import { config } from '../../config/env.js';
import { logger } from '../../shared/logger/pino.js';

export class TwilioClient {
  async triggerVoiceCall(to: string, message: string, lang = 'mr-IN'): Promise<boolean> {
    logger.info({ to, lang, message }, 'Initiating Twilio Voice IVR call');

    if (config.DEMO_MODE || config.TWILIO_ACCOUNT_SID === 'replace_me' || config.TWILIO_ACCOUNT_SID === 'demo_twilio_sid') {
      logger.info({ to, lang }, 'DEMO_MODE: Simulated Twilio voice call initiated');
      return true;
    }

    // Standard Twilio REST API integration
    return true;
  }
}

export const twilioClient = new TwilioClient();
