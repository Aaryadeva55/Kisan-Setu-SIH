import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeLocationScore,
  computeQuantityScore,
  computePriceScore,
  scoreMatchPair,
} from '../src/modules/matching/matching.calculator.js';

describe('Buyer/FPO Matching Engine', () => {
  it('should return score 0 if crops do not match', () => {
    const intent = { cropId: 'crop_soybean', quantityKg: 500 };
    const req = { cropId: 'crop_cotton', quantityKg: 500 };
    const result = scoreMatchPair(intent, req);
    assert.strictEqual(result.score, 0);
  });

  it('should calculate accurate location scores', () => {
    // Same district -> 1.0
    assert.strictEqual(computeLocationScore('dist_nashik', 'dist_nashik'), 1.0);
    // Different district -> 0.6
    assert.strictEqual(computeLocationScore('dist_nashik', 'dist_pune'), 0.6);
  });

  it('should calculate quantity fit correctly', () => {
    // Exact match -> 1.0
    assert.strictEqual(computeQuantityScore(1000, 1000), 1.0);
    // 20% diff -> 0.8
    assert.strictEqual(computeQuantityScore(800, 1000), 0.8);
  });

  it('should calculate price score correctly', () => {
    // Below max price -> 1.0
    assert.strictEqual(computePriceScore(2000, 2200), 1.0);
    // Above max price -> scaled down
    const score = computePriceScore(2400, 2000);
    assert.ok(score < 1.0 && score >= 0.0);
  });

  it('should compute weighted composite match score with explainable breakdown', () => {
    const intent = {
      cropId: 'crop_soybean',
      farmer: { districtId: 'dist_nashik' },
      quantityKg: 2000,
      expectedPrice: 4700,
    };

    const req = {
      cropId: 'crop_soybean',
      districtId: 'dist_nashik',
      quantityKg: 2000,
      maxPrice: 4800,
    };

    const result = scoreMatchPair(intent, req);
    assert.ok(result.score >= 0.85, `Expected score >= 0.85, got ${result.score}`);
    assert.strictEqual(result.breakdown.locationScore, 1.0);
    assert.strictEqual(result.breakdown.quantityScore, 1.0);
    assert.strictEqual(result.breakdown.priceScore, 1.0);
  });
});
