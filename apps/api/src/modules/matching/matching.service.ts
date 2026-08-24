import { matchingRepository } from './matching.repository.js';
import { scoreMatchPair } from './matching.calculator.js';
import { MatchScoreResult } from '@kisan-setu/types';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/pino.js';

export class MatchingService {
  async computeMatchScore(intent: any, requirement: any): Promise<MatchScoreResult> {
    return scoreMatchPair(intent, requirement);
  }

  async runMatchingForSellIntent(sellIntentId: string) {
    const intent = await matchingRepository.getSellIntentById(sellIntentId);
    if (!intent) {
      throw new NotFoundError('SellIntent');
    }

    const requirements = await matchingRepository.findMatchingRequirementsForIntent(intent.cropId);
    const matches = [];

    for (const req of requirements) {
      const matchResult = scoreMatchPair(intent, req);
      if (matchResult.score >= 0.4) {
        const match = await matchingRepository.upsertMatch({
          sellIntentId: intent.id,
          buyerRequirementId: req.id,
          score: matchResult.score,
          scoreBreakdown: matchResult.breakdown,
        });
        matches.push(match);
      }
    }

    logger.info(
      { sellIntentId, candidatesGenerated: matches.length },
      'Matching scan completed for SellIntent'
    );
    return matches;
  }

  async runMatchingForRequirement(requirementId: string) {
    const req = await matchingRepository.getBuyerRequirementById(requirementId);
    if (!req) {
      throw new NotFoundError('BuyerRequirement');
    }

    const intents = await matchingRepository.findMatchingIntentsForRequirement(req.cropId);
    const matches = [];

    for (const intent of intents) {
      const matchResult = scoreMatchPair(intent, req);
      if (matchResult.score >= 0.4) {
        const match = await matchingRepository.upsertMatch({
          sellIntentId: intent.id,
          buyerRequirementId: req.id,
          score: matchResult.score,
          scoreBreakdown: matchResult.breakdown,
        });
        matches.push(match);
      }
    }

    logger.info(
      { requirementId, candidatesGenerated: matches.length },
      'Matching scan completed for BuyerRequirement'
    );
    return matches;
  }

  async getCandidates(sellIntentId: string) {
    return matchingRepository.getCandidatesForSellIntent(sellIntentId, 0.4);
  }
}

export const matchingService = new MatchingService();
