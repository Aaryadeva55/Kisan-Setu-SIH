import { Request, Response, NextFunction } from 'express';
import { transactionsService } from './transactions.service.js';
import { Role, TransactionStatus } from '@kisan-setu/types';

export class TransactionsController {
  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.userId;
      const status = req.query.status as TransactionStatus | undefined;
      const search = req.query.q as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      let buyerId: string | undefined;
      let farmerId: string | undefined;
      let fpoId: string | undefined;

      if (userRole === Role.BUYER) {
        buyerId = userId;
      } else if (userRole === Role.FARMER) {
        farmerId = userId;
      } else if (userRole === Role.FPO) {
        fpoId = userId;
      }

      const result = await transactionsService.listTransactions({
        status,
        buyerId,
        farmerId,
        fpoId,
        search,
        page,
        pageSize,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTransactionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const transaction = await transactionsService.getTransactionById(id);
      return res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionsService.createTransaction(req.user!.userId, req.body);
      return res.status(201).json({ transaction });
    } catch (err) {
      next(err);
    }
  }

  async acceptTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const transaction = await transactionsService.acceptTransaction(req.user!.userId, id, note);
      return res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  }

  async rejectTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body || {};
      const transaction = await transactionsService.rejectTransaction(req.user!.userId, id, rejectionReason);
      return res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  }

  async completeTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const transaction = await transactionsService.completeTransaction(req.user!.userId, id, note);
      return res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  }

  async cancelTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const transaction = await transactionsService.cancelTransaction(req.user!.userId, id, note);
      return res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  }
}

export const transactionsController = new TransactionsController();
