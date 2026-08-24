import { prisma } from '../../infra/prisma.js';
import { Role, Language } from '@kisan-setu/types';
import { whatsappClient } from '../../integrations/whatsapp/whatsapp.client.js';
import { processConversationStep } from './whatsapp.state-machine.js';
import { logger } from '../../shared/logger/pino.js';

export class WhatsAppService {
  async handleInboundMessage(payload: {
    fromPhone: string;
    messageText: string;
    externalMsgId?: string;
  }) {
    const { fromPhone, messageText, externalMsgId } = payload;

    // Idempotency check: if externalMsgId seen, short-circuit
    if (externalMsgId) {
      const existing = await prisma.message.findUnique({
        where: { externalMsgId },
      });
      if (existing) {
        logger.info({ externalMsgId }, 'Duplicate WhatsApp message received, short-circuiting');
        return { status: 'DUPLICATE_IGNORED' };
      }
    }

    // Find or create User by phone
    let user = await prisma.user.findUnique({
      where: { phone: fromPhone },
      include: { farmerProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: fromPhone,
          role: Role.FARMER,
          preferredLang: Language.MARATHI,
        },
        include: { farmerProfile: true },
      });
    }

    // Find or create active Conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          channel: 'WHATSAPP',
          state: 'LANGUAGE_SELECTION',
          context: {},
        },
      });
    }

    // Record inbound message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        externalMsgId: externalMsgId || null,
        content: messageText,
      },
    });

    // Execute state machine step
    const { nextState, responseText, updatedContext } = await processConversationStep(
      user,
      conversation.state,
      (conversation.context as any) || {},
      messageText
    );

    // Update conversation state in DB
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        state: nextState,
        context: updatedContext || conversation.context || {},
      },
    });

    // Record outbound message in DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        content: responseText,
      },
    });

    // Send WhatsApp reply
    await whatsappClient.sendTextMessage(fromPhone, responseText);

    return {
      status: 'PROCESSED',
      replySent: responseText,
      nextState,
    };
  }
}

export const whatsappService = new WhatsAppService();
