import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RULES, RuleEvaluationContext } from '../src/modules/recommendation/recommendation.rules.js';

describe('Recommendation Rules Engine', () => {
  it('should penalize high-water crop in low rainfall conditions', () => {
    const rule = RULES.find((r) => r.id === 'low_rainfall_high_water_crop')!;
    assert.ok(rule, 'Rule should exist');

    const ctx: RuleEvaluationContext = {
      farmer: { id: 'farmer_1', districtId: 'dist_1' },
      crop: { id: 'crop_sugarcane', name: 'Sugarcane', waterReq: 'HIGH' },
      weather: { rainfallLast30dMm: 25 },
      market: { priceTrendPercent30d: 2 },
      districtOversupplyCount: 1,
    };

    const result = rule.evaluate(ctx);
    assert.strictEqual(result.applies, true);
    assert.strictEqual(result.delta, -25);
    assert.match(result.reasonText, /needs high water supply/);
  });

  it('should reward crop if in active sowing season', () => {
    const rule = RULES.find((r) => r.id === 'season_match')!;
    const currentMonth = new Date().getMonth() + 1;

    const ctx: RuleEvaluationContext = {
      farmer: { id: 'farmer_1', districtId: 'dist_1' },
      crop: {
        id: 'crop_soybean',
        name: 'Soybean',
        seasons: [{ season: 'CurrentSeason', sowStart: currentMonth, sowEnd: currentMonth, harvestStart: 10, harvestEnd: 11 }],
      },
      weather: { rainfallLast30dMm: 80 },
      market: { priceTrendPercent30d: 0 },
      districtOversupplyCount: 0,
    };

    const result = rule.evaluate(ctx);
    assert.strictEqual(result.applies, true);
    assert.strictEqual(result.delta, 20);
    assert.match(result.reasonText, /optimal sowing window/);
  });

  it('should boost score on rising mandi price trend (>5%)', () => {
    const rule = RULES.find((r) => r.id === 'rising_price_trend')!;

    const ctx: RuleEvaluationContext = {
      farmer: { id: 'farmer_1', districtId: 'dist_1' },
      crop: { id: 'crop_onion', name: 'Onion' },
      weather: { rainfallLast30dMm: 60 },
      market: { priceTrendPercent30d: 12.5 },
      districtOversupplyCount: 1,
    };

    const result = rule.evaluate(ctx);
    assert.strictEqual(result.applies, true);
    assert.strictEqual(result.delta, 15);
    assert.match(result.reasonText, /trending upward/);
  });

  it('should penalize when local district oversupply is detected', () => {
    const rule = RULES.find((r) => r.id === 'oversupply_signal')!;

    const ctx: RuleEvaluationContext = {
      farmer: { id: 'farmer_1', districtId: 'dist_1' },
      crop: { id: 'crop_tomato', name: 'Tomato' },
      weather: { rainfallLast30dMm: 55 },
      market: { priceTrendPercent30d: 0 },
      districtOversupplyCount: 8,
    };

    const result = rule.evaluate(ctx);
    assert.strictEqual(result.applies, true);
    assert.strictEqual(result.delta, -10);
    assert.match(result.reasonText, /increase local supply/);
  });
});
