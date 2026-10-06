import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Simulation & Backtest E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/historical/ipos should load historical IPO dataset', async () => {
    const res = await request(app.getHttpServer()).get('/api/historical/ipos').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.ipos)).toBe(true);
    const ipo = res.body.ipos[0];
    expect(ipo).toHaveProperty('symbol');
    expect(ipo).toHaveProperty('ipoPrice');
    expect(ipo).toHaveProperty('totalRunReturnPercent');
  });

  it('POST /api/historical/backtest should simulate portfolio performance over historical IPOs', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/historical/backtest')
      .send({
        initialCapitalToman: 40_000_000,
        allocationMode: 'fixed',
        fixedAllocationToman: 8_000_000,
        connectionType: 'fiber',
        burstCount: 5,
        burstIntervalMs: 2.5,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.report).toHaveProperty('summary');
    expect(res.body.report).toHaveProperty('equityCurve');
    expect(res.body.report).toHaveProperty('trades');
    expect(res.body.report.summary.initialCapitalToman).toBe(40_000_000);
    expect(typeof res.body.report.summary.portfolioTotalReturnPercent).toBe('number');
  });

  it('POST /api/backtest/run should run opening market simulation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/backtest/run')
      .send({ runs: 2 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.report).toHaveProperty('enginePrecisionTest');
    expect(res.body.report).toHaveProperty('scenarios');
    expect(res.body.report).toHaveProperty('overallVerdict');
  });
});
