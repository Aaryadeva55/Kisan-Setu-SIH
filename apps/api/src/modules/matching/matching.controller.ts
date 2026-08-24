import { Request, Response, NextFunction } from 'express';
import { matchingService } from './matching.service.js';

export class MatchingController {
  async runMatchScan(req: Request, res: Response, next: NextFunction) {
    try {
      const { sellIntentId, buyerRequirementId } = req.body;
      let matches = [];

      if (sellIntentId) {
        matches = await matchingService.runMatchingForSellIntent(sellIntentId);
      } else if (buyerRequirementId) {
        matches = await matchingService.runMatchingForRequirement(buyerRequirementId);
      } else {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Provide either sellIntentId or buyerRequirementId to trigger scan',
          },
        });
      }

      return res.status(200).json({ matches, count: matches.length });
    } catch (err) {
      next(err);
    }
  }

  async getCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { sellIntentId } = req.params;
      const candidates = await matchingService.getCandidates(sellIntentId);
      return res.status(200).json({ candidates });
    } catch (err) {
      next(err);
    }
  }
}

export const matchingController = new MatchingController();
