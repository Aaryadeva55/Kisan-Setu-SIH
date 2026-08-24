import { clamp, calculateDistanceKm } from '@kisan-setu/shared';
import { MatchScoreResult } from '@kisan-setu/types';

export function computeLocationScore(
  farmerDistrictId: string,
  buyerDistrictId?: string | null,
  radiusKm?: number | null,
  farmerCoords?: { lat?: number | null; lng?: number | null },
  mandiCoords?: { lat?: number | null; lng?: number | null }
): number {
  if (!buyerDistrictId && !radiusKm) {
    return 0.8; // State-level open matching
  }

  if (buyerDistrictId && farmerDistrictId === buyerDistrictId) {
    return 1.0; // Same district is 100%
  }

  if (radiusKm && farmerCoords?.lat && mandiCoords?.lat) {
    const dist = calculateDistanceKm(
      farmerCoords.lat,
      farmerCoords.lng,
      mandiCoords.lat,
      mandiCoords.lng
    );
    if (dist != null) {
      if (dist <= radiusKm) {
        return clamp(1 - dist / (radiusKm * 1.5), 0.3, 1.0);
      }
      return 0.2; // Outside requested radius
    }
  }

  // Neighboring district default
  return 0.6;
}

export function computeQuantityScore(intentKg: number, reqKg: number): number {
  if (reqKg <= 0) return 0.5;
  const diffRatio = Math.abs(intentKg - reqKg) / reqKg;
  return clamp(1 - diffRatio, 0.1, 1.0);
}

export function computePriceScore(
  expectedPrice?: number | null,
  maxPrice?: number | null
): number {
  if (!maxPrice || !expectedPrice) {
    return 0.6; // Neutral acceptable score
  }

  if (expectedPrice <= maxPrice) {
    return 1.0;
  }

  const excessRatio = (expectedPrice - maxPrice) / maxPrice;
  return clamp(1 - excessRatio * 2, 0.0, 1.0);
}

export function computeTimingScore(
  harvestDate?: Date | null,
  neededByDate?: Date | null
): number {
  if (!harvestDate || !neededByDate) {
    return 0.7;
  }

  const diffDays = Math.abs(
    (new Date(neededByDate).getTime() - new Date(harvestDate).getTime()) / (1000 * 3600 * 24)
  );

  if (diffDays <= 7) return 1.0;
  if (diffDays <= 21) return 0.8;
  if (diffDays <= 45) return 0.5;
  return 0.2;
}

export function scoreMatchPair(intent: any, req: any): MatchScoreResult {
  if (intent.cropId !== req.cropId) {
    return {
      score: 0,
      breakdown: {
        locationScore: 0,
        quantityScore: 0,
        priceScore: 0,
        qualityScore: 0,
        timingScore: 0,
        baseScore: 0,
      },
    };
  }

  const farmerDistrictId = intent.farmer?.districtId || intent.districtId;
  const locationScore = computeLocationScore(
    farmerDistrictId,
    req.districtId,
    req.radiusKm,
    { lat: intent.farmer?.latitude, lng: intent.farmer?.longitude }
  );

  const quantityScore = computeQuantityScore(intent.quantityKg, req.quantityKg);
  const priceScore = computePriceScore(intent.expectedPrice, req.maxPrice);
  const qualityScore = req.minQuality ? 0.9 : 1.0;
  const timingScore = computeTimingScore(intent.harvestDate, req.neededByDate);
  const baseScore = 1.0;

  // Weighted composition (from Section 15 of backend.md)
  const compositeScore =
    0.20 * locationScore +
    0.15 * quantityScore +
    0.15 * priceScore +
    0.10 * qualityScore +
    0.10 * timingScore +
    0.30 * baseScore;

  const finalScore = parseFloat(clamp(compositeScore, 0, 1).toFixed(2));

  return {
    score: finalScore,
    breakdown: {
      locationScore: parseFloat(locationScore.toFixed(2)),
      quantityScore: parseFloat(quantityScore.toFixed(2)),
      priceScore: parseFloat(priceScore.toFixed(2)),
      qualityScore: parseFloat(qualityScore.toFixed(2)),
      timingScore: parseFloat(timingScore.toFixed(2)),
      baseScore: 1.0,
    },
  };
}
