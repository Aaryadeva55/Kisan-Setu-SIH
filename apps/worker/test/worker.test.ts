import { describe, it } from 'node:test';
import assert from 'node:assert';
import { QUEUE_NAMES } from '@kisan-setu/types';
import { mandiApiClient } from '../src/clients/mandi.client.js';
import { weatherApiClient } from '../src/clients/weather.client.js';

describe('Background Worker Processors and Client Resilience', () => {
  it('should declare all required BullMQ queue names', () => {
    assert.strictEqual(QUEUE_NAMES.PRICE_INGESTION, 'price-ingestion');
    assert.strictEqual(QUEUE_NAMES.WEATHER_INGESTION, 'weather-ingestion');
    assert.strictEqual(QUEUE_NAMES.BUYER_MATCHING, 'buyer-matching');
    assert.strictEqual(QUEUE_NAMES.NOTIFICATIONS, 'notifications');
    assert.strictEqual(QUEUE_NAMES.WHATSAPP, 'whatsapp');
    assert.strictEqual(QUEUE_NAMES.CLEANUP, 'cleanup');
  });

  it('should retrieve Mandi price records in fallback/demo mode', async () => {
    const records = await mandiApiClient.fetchLatest();
    assert.ok(Array.isArray(records));
    assert.ok(records.length > 0);
    assert.ok(records[0].cropName);
    assert.ok(records[0].modal > 0);
  });

  it('should retrieve weather forecast records for district', async () => {
    const weather = await weatherApiClient.fetchDistrictWeather('Nashik');
    assert.ok(Array.isArray(weather));
    assert.ok(weather.length >= 3);
    assert.strictEqual(weather[0].districtName, 'Nashik');
    assert.ok(weather[0].tempMaxC > 0);
  });
});
