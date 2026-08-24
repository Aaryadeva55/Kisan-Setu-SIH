import { Router } from 'express';
import { whatsappController } from './whatsapp.controller.js';

const router = Router();

router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);
router.post('/simulate', whatsappController.simulateMessage);

export default router;
