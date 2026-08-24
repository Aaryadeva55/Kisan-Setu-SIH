import { transactionsRepository } from './transactions.repository.js';
import { prisma } from '../../infra/prisma.js';
import { TransactionStatus, Role, Language } from '@kisan-setu/types';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors/AppError.js';
import { whatsappClient } from '../../integrations/whatsapp/whatsapp.client.js';
import { t } from '../../locales/agriDict.js';
import { logger } from '../../shared/logger/pino.js';

export class TransactionsService {
  async listTransactions(filters: any) {
    const { total, data } = await transactionsRepository.listTransactions(filters);
    const pageSize = filters.pageSize || 20;
    return {
      data,
      pagination: {
        page: filters.page || 1,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getTransactionById(id: string) {
    const transaction = await transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction');
    }
    return transaction;
  }

  async createTransaction(
    userId: string,
    data: { matchId: string; quantityKg: number; agreedPrice?: number }
  ) {
    const existing = await transactionsRepository.findByMatchId(data.matchId);
    if (existing) {
      throw new ConflictError('This match already has a transaction created.');
    }

    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: {
        sellIntent: { include: { farmer: true, crop: true } },
        buyerRequirement: { include: { buyer: { include: { user: true } } } },
      },
    });

    if (!match) {
      throw new NotFoundError('Match');
    }

    return prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          matchId: data.matchId,
          quantityKg: data.quantityKg,
          agreedPrice: data.agreedPrice || match.sellIntent.expectedPrice,
          status: TransactionStatus.REQUESTED,
        },
        include: {
          match: {
            include: {
              sellIntent: { include: { crop: true, farmer: true } },
              buyerRequirement: { include: { buyer: true } },
            },
          },
        },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId: txn.id,
          fromStatus: null,
          toStatus: TransactionStatus.REQUESTED,
          changedBy: `USER:${userId}`,
          note: 'Transaction requested from match candidate',
        },
      });

      await tx.sellIntent.update({
        where: { id: match.sellIntentId },
        data: { status: 'MATCHED' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_CREATE',
          entity: 'Transaction',
          entityId: txn.id,
          metadata: { matchId: match.id, quantityKg: data.quantityKg },
        },
      });

      return txn;
    });
  }

  async acceptTransaction(userId: string, transactionId: string, note?: string) {
    const txn = await this.getTransactionById(transactionId);

    if (txn.status !== TransactionStatus.REQUESTED && txn.status !== TransactionStatus.PENDING_BUYER) {
      throw new ConflictError(`Cannot accept transaction in '${txn.status}' state`);
    }

    const buyerUser = txn.match.buyerRequirement.buyer.user;
    // Allow buyer owner or admin
    if (txn.match.buyerRequirement.buyer.userId !== userId && buyerUser?.id !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== Role.ADMIN) {
        throw new ForbiddenError('Only the assigned buyer can accept this transaction');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTxn = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.ACCEPTED },
        include: {
          match: {
            include: {
              sellIntent: { include: { crop: true, farmer: { include: { user: true } } } },
              buyerRequirement: { include: { buyer: true } },
            },
          },
        },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: txn.status,
          toStatus: TransactionStatus.ACCEPTED,
          changedBy: `USER:${userId}`,
          note: note || 'Transaction accepted by Buyer',
        },
      });

      // Decrement or close BuyerRequirement quantity
      const req = txn.match.buyerRequirement;
      const remainingQty = Math.max(0, req.quantityKg - txn.quantityKg);
      await tx.buyerRequirement.update({
        where: { id: req.id },
        data: {
          quantityKg: remainingQty,
          isActive: remainingQty > 0,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_ACCEPT',
          entity: 'Transaction',
          entityId: transactionId,
        },
      });

      return updatedTxn;
    });

    // Notify farmer over WhatsApp
    try {
      const farmerUser = updated.match.sellIntent.farmer.user;
      if (farmerUser?.phone) {
        const msg = t('transaction_accepted', (farmerUser.preferredLang as any) as Language, {
          buyerName: updated.match.buyerRequirement.buyer.companyName,
          quantity: updated.quantityKg,
          cropName: updated.match.sellIntent.crop.name,
        });
        await whatsappClient.sendTextMessage(farmerUser.phone, msg);
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to send WhatsApp acceptance notification to farmer');
    }

    return updated;
  }

  async rejectTransaction(userId: string, transactionId: string, rejectionReason?: string) {
    const txn = await this.getTransactionById(transactionId);

    if (txn.status !== TransactionStatus.REQUESTED && txn.status !== TransactionStatus.PENDING_BUYER) {
      throw new ConflictError(`Cannot reject transaction in '${txn.status}' state`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.REJECTED },
        include: {
          match: {
            include: {
              sellIntent: { include: { crop: true, farmer: { include: { user: true } } } },
              buyerRequirement: { include: { buyer: true } },
            },
          },
        },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: txn.status,
          toStatus: TransactionStatus.REJECTED,
          changedBy: `USER:${userId}`,
          note: rejectionReason || 'Transaction rejected by Buyer',
        },
      });

      // Reopen SellIntent for future matching
      await tx.sellIntent.update({
        where: { id: txn.match.sellIntentId },
        data: { status: 'OPEN' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_REJECT',
          entity: 'Transaction',
          entityId: transactionId,
          metadata: { reason: rejectionReason },
        },
      });

      return updated;
    });
  }

  async completeTransaction(userId: string, transactionId: string, note?: string) {
    const txn = await this.getTransactionById(transactionId);

    if (txn.status !== TransactionStatus.ACCEPTED && txn.status !== TransactionStatus.IN_PROGRESS) {
      throw new ConflictError(`Cannot complete transaction from '${txn.status}' state`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.COMPLETED },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: txn.status,
          toStatus: TransactionStatus.COMPLETED,
          changedBy: `USER:${userId}`,
          note: note || 'Transaction fulfilled and marked COMPLETED',
        },
      });

      await tx.sellIntent.update({
        where: { id: txn.match.sellIntentId },
        data: { status: 'COMPLETED' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_COMPLETE',
          entity: 'Transaction',
          entityId: transactionId,
        },
      });

      return updated;
    });
  }

  async cancelTransaction(userId: string, transactionId: string, note?: string) {
    const txn = await this.getTransactionById(transactionId);

    if (txn.status === TransactionStatus.COMPLETED || txn.status === TransactionStatus.CANCELLED) {
      throw new ConflictError(`Transaction is already terminal (${txn.status})`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.CANCELLED },
      });

      await tx.transactionStatusHistory.create({
        data: {
          transactionId,
          fromStatus: txn.status,
          toStatus: TransactionStatus.CANCELLED,
          changedBy: `USER:${userId}`,
          note: note || 'Transaction cancelled',
        },
      });

      // Reopen SellIntent
      await tx.sellIntent.update({
        where: { id: txn.match.sellIntentId },
        data: { status: 'OPEN' },
      });

      return updated;
    });
  }
}

export const transactionsService = new TransactionsService();
