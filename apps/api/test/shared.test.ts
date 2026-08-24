import { describe, it } from 'node:test';
import assert from 'node:assert';
import { clamp, formatCurrencyINR, calculateDistanceKm } from '@kisan-setu/shared';
import { t, translateCropName } from '../src/locales/agriDict.js';
import { Language } from '@kisan-setu/types';

describe('Shared Utilities and Regional Localization', () => {
  it('should clamp numbers properly', () => {
    assert.strictEqual(clamp(50, 0, 100), 50);
    assert.strictEqual(clamp(-10, 0, 100), 0);
    assert.strictEqual(clamp(150, 0, 100), 100);
  });

  it('should calculate geographic distance in km', () => {
    // Distance between Nashik (19.9975, 73.7898) and Pune (18.5204, 73.8567) is ~165 km
    const dist = calculateDistanceKm(19.9975, 73.7898, 18.5204, 73.8567);
    assert.ok(dist !== null);
    assert.ok(dist > 150 && dist < 180, `Expected distance ~165km, got ${dist}`);
  });

  it('should translate crop names to Marathi, Hindi, and English', () => {
    assert.strictEqual(translateCropName('Soybean', Language.MARATHI), 'सोयाबीन');
    assert.strictEqual(translateCropName('Cotton', Language.MARATHI), 'कापूस');
    assert.strictEqual(translateCropName('Cotton', Language.HINDI), 'कपास');
    assert.strictEqual(translateCropName('Onion', Language.MARATHI), 'कांदा');
  });

  it('should interpolate parameterized dictionary strings in Marathi', () => {
    const text = t('match_found', Language.MARATHI, {
      buyerName: 'Sahyadri Agro',
      cropName: 'सोयाबीन',
      quantity: 500,
      price: 4800,
      score: 92,
    });

    assert.match(text, /Sahyadri Agro/);
    assert.match(text, /सोयाबीन/);
    assert.match(text, /500/);
    assert.match(text, /92%/);
  });
});
