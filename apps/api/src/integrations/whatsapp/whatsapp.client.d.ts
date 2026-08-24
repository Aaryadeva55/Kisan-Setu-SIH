export interface WhatsAppMessagePayload {
    to: string;
    type: 'text' | 'interactive' | 'template';
    text?: {
        body: string;
    };
    interactive?: any;
}
export declare class WhatsAppClient {
    private apiUrl;
    private token;
    private appSecret;
    constructor();
    verifyWebhookSignature(signatureHeader: string | undefined, rawBody: string | Buffer): boolean;
    sendTextMessage(to: string, body: string): Promise<boolean>;
}
export declare const whatsappClient: WhatsAppClient;
//# sourceMappingURL=whatsapp.client.d.ts.map