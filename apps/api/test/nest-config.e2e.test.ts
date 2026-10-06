import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Config E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/config should save valid bot configuration', async () => {
    const validConfig = {
      order: {
        symbol: 'شستا',
        price: 1540,
        quantity: 10000,
        side: 'BUY',
        brokerType: 'custom',
        antiDoubleSpend: true,
      },
      network: {
        targetUrl: 'https://online.example.ir/api/order',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        bodyTemplate: '{"symbol":"{{symbol}}"}',
      },
      timing: {
        targetTime: '08:45:00.000',
        leadTimeMs: 22,
        burstCount: 6,
        burstIntervalMs: 3.5,
        preWarmSeconds: 15,
        stopOnFirstSuccess: true,
      },
      serverPort: 3880,
    };

    const res = await request(app.getHttpServer())
      .post('/api/config')
      .send(validConfig)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.config.order.symbol).toBe('شستا');
    expect(res.body.config.timing.leadTimeMs).toBe(22);
  });

  it('POST /api/config should reject invalid side parameter with 400 Bad Request', async () => {
    const invalidConfig = {
      order: {
        symbol: 'شستا',
        price: 1540,
        quantity: 10000,
        side: 'INVALID_SIDE', // Not BUY or SELL
        brokerType: 'custom',
      },
      network: {
        targetUrl: 'https://online.example.ir/api/order',
        method: 'POST',
        bodyTemplate: '{}',
      },
      timing: {
        targetTime: '08:45:00.000',
        leadTimeMs: 20,
        burstCount: 5,
        burstIntervalMs: 2,
      },
    };

    const res = await request(app.getHttpServer())
      .post('/api/config')
      .send(invalidConfig)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
  });
});
