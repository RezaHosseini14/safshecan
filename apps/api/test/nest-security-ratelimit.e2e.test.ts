import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Security & Rate Limit E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Security: should return enterprise security headers on responses', async () => {
    const res = await request(app.getHttpServer()).get('/api/status');

    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('cross-origin-opener-policy');
  });

  it('Security: should reject malicious or malformed JSON payloads with 400 Bad Request', async () => {
    const malformedPayload = {
      order: {
        symbol: 12345, // invalid type, should be string
        price: 'NOT_A_NUMBER', // invalid type
        quantity: -100,
        side: 'HACK_BUY', // invalid enum
      },
    };

    const res = await request(app.getHttpServer())
      .post('/api/config')
      .send(malformedPayload)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
  });

  it('Rate Limiting: should trigger 429 Too Many Requests when rate limit threshold is exceeded', async () => {
    // We configured @Throttle({ default: { limit: 12, ttl: 60000 } }) on /api/sniper/test-shot
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(request(app.getHttpServer()).post('/api/sniper/test-shot'));
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    const hasRateLimited = statuses.includes(429);
    expect(hasRateLimited).toBe(true);

    const throttledResponse = responses.find((r) => r.status === 429);
    expect(throttledResponse?.body).toHaveProperty('statusCode', 429);
  });
});
