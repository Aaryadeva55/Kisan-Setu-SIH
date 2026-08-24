import { recommendationRepository } from './recommendation.repository.js';
import { cropsRepository } from '../crops/crops.repository.js';
import { marketService } from '../market/market.service.js';
import { RULES, RuleEvaluationContext } from './recommendation.rules.js';
import { clamp } from '@kisan-setu/shared';
import { RuleResult, AdvisoryResult } from '@kisan-setu/types';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/pino.js';

export class RecommendationService {
  async generateAdvisoryForFarmer(farmerIdentifier: string, cropIdFilter?: string): Promise<AdvisoryResult[]> {
    const farmer = await recommendationRepository.getFarmerProfile(farmerIdentifier);
    if (!farmer) {
      throw new NotFoundError('FarmerProfile');
    }

    const candidateCrops = cropIdFilter
      ? [await cropsRepository.findById(cropIdFilter)].filter(Boolean)
      : await cropsRepository.listAll();

    const rainfall30d = await recommendationRepository.getDistrictRainfallLast30d(farmer.districtId);

    const results: AdvisoryResult[] = [];

    for (const crop of candidateCrops) {
      if (!crop) continue;

      const priceHistory = await marketService.getPriceHistory(crop.id, undefined, farmer.districtId, 30);
      const oversupplyCount = await recommendationRepository.getOpenSellIntentsCount(crop.id, farmer.districtId);

      const ctx: RuleEvaluationContext = {
        farmer: {
          id: farmer.id,
          districtId: farmer.districtId,
          landSizeAcres: farmer.landSizeAcres,
        },
        crop: {
          id: crop.id,
          name: crop.name,
          waterReq: crop.waterReq,
          seasons: crop.seasons,
        },
        weather: {
          rainfallLast30dMm: rainfall30d,
        },
        market: {
          priceTrendPercent30d: priceHistory.trendPercent,
          latestModalPrice: priceHistory.history[priceHistory.history.length - 1]?.modalPrice,
        },
        districtOversupplyCount: oversupplyCount,
      };

      let score = 50; // Baseline neutral score
      const firedRules: RuleResult[] = [];

      for (const rule of RULES) {
        try {
          const ruleResult = rule.evaluate(ctx);
          if (ruleResult.applies) {
            score += ruleResult.delta;
            firedRules.push(ruleResult);
          }
        } catch (err) {
          logger.warn({ ruleId: rule.id, err }, 'Rule evaluation failed');
        }
      }

      const normalizedScore = clamp(score, 5, 98);
      const reason = firedRules.map((r) => r.reasonText).filter(Boolean).join(' ');

      // Save to database
      await recommendationRepository.saveAdvisory({
        farmerId: farmer.id,
        cropId: crop.id,
        suitabilityScore: normalizedScore,
        reason: reason || `${crop.name} is suitable for cultivation based on regional conditions.`,
        ruleTrace: firedRules,
      });

      results.push({
        cropId: crop.id,
        cropName: crop.name,
        suitabilityScore: normalizedScore,
        reason: reason || `${crop.name} is suitable for cultivation based on regional conditions.`,
        ruleTrace: firedRules,
      });
    }

    // Rank highest suitability score first
    return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  async getLatestAdvisories(farmerIdentifier: string) {
    return recommendationRepository.getLatestAdvisories(farmerIdentifier, 5);
  }
}

export const recommendationService = new RecommendationService();
