import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Express API Integration Tests', () => {
  it('GET /health should return 200 OK with service metadata', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'kisan-setu-api');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/v1/whatsapp/webhook should respond to Meta hub challenge verification', async () => {
    const res = await request(app)
      .get('/api/v1/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'kisan_setu_webhook_verify_token_2026',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.text, 'CHALLENGE_ACCEPTED_123');
  });

  it('GET /api/v1/whatsapp/webhook should reject invalid verify token', async () => {
    const res = await request(app)
      .get('/api/v1/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'CHALLENGE_123',
      });

    assert.strictEqual(res.status, 403);
  });

  it('Protected route should return 401 UNAUTHORIZED when token is missing', async () => {
    const res = await request(app).get('/api/v1/transactions');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error?.code, 'UNAUTHORIZED');
  });
});
