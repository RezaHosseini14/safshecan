import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

const SECRET_COOKIE = 'saf-shekan-secret-cookie-9f3a';
const SECRET_TOKEN = 'saf-shekan-secret-bearer-9f3a';

describe('secret redaction', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not return broker cookies or authorization on GET /api/status', async () => {
    const validConfig = {
      order: {
        symbol: 'شستا',
        price: 1540,
        quantity: 10000,
        side: 'BUY',
        brokerType: 'custom',
      },
      network: {
        targetUrl: 'https://online.example.ir/api/order',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SECRET_TOKEN}`,
        },
        bodyTemplate: '{"symbol":"{{symbol}}"}',
        cookies: SECRET_COOKIE,
      },
      timing: {
        targetTime: '08:45:00.000',
        leadTimeMs: 22,
        burstCount: 6,
        burstIntervalMs: 3.5,
        preWarmSeconds: 15,
        stopOnFirstSuccess: true,
      },
    };

    await request(app.getHttpServer()).post('/api/config').send(validConfig).expect(200);

    const res = await request(app.getHttpServer()).get('/api/status').expect(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(SECRET_COOKIE);
    expect(body).not.toContain(SECRET_TOKEN);
    expect(res.body.config.network.cookies).toBe('[redacted]');
    expect(res.body.config.network.headers.Authorization).toBe('[redacted]');
  });

  it('keeps disarm reachable after the test-shot limit is hit', async () => {
    const shots = await Promise.all(
      Array.from({ length: 15 }, () => request(app.getHttpServer()).post('/api/sniper/test-shot'))
    );
    expect(shots.some((shot) => shot.status === 429)).toBe(true);

    const disarm = await request(app.getHttpServer()).post('/api/sniper/disarm');
    expect(disarm.status).toBe(200);
    expect(disarm.body.success).toBe(true);
  });
});
