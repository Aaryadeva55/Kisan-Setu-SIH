"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappClient = exports.WhatsAppClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_js_1 = require("../../config/env.js");
const pino_js_1 = require("../../shared/logger/pino.js");
class WhatsAppClient {
    apiUrl;
    token;
    appSecret;
    constructor() {
        this.apiUrl = `https://graph.facebook.com/v19.0/${env_js_1.config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        this.token = env_js_1.config.WHATSAPP_ACCESS_TOKEN;
        this.appSecret = env_js_1.config.WHATSAPP_APP_SECRET;
    }
    verifyWebhookSignature(signatureHeader, rawBody) {
        if (!signatureHeader)
            return false;
        if (env_js_1.config.DEMO_MODE || env_js_1.config.NODE_ENV === 'test')
            return true;
        try {
            const elements = signatureHeader.split('=');
            const signature = elements[1];
            const hmac = crypto_1.default.createHmac('sha256', this.appSecret);
            hmac.update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
            const digest = hmac.digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
        }
        catch (err) {
            pino_js_1.logger.warn({ err }, 'WhatsApp signature verification failed');
            return false;
        }
    }
    async sendTextMessage(to, body) {
        pino_js_1.logger.info({ to, bodyLength: body.length }, 'Sending WhatsApp text message');
        if (env_js_1.config.DEMO_MODE || this.token === 'replace_me' || this.token === 'demo_access_token') {
            pino_js_1.logger.info({ to, body }, 'DEMO_MODE: Simulated WhatsApp send success');
            return true;
        }
        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
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
            if (!res.ok) {
                const errorText = await res.text();
                pino_js_1.logger.error({ status: res.status, errorText }, 'WhatsApp Cloud API send failed');
                return false;
            }
            return true;
        }
        catch (err) {
            pino_js_1.logger.error({ err }, 'WhatsApp Cloud API network exception');
            return false;
        }
    }
}
exports.WhatsAppClient = WhatsAppClient;
exports.whatsappClient = new WhatsAppClient();
//# sourceMappingURL=whatsapp.client.js.map