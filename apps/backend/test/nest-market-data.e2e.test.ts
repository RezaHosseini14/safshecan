import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Market Data E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/market/status returns watchlist shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/market/status').expect(200);

    expect(res.body).toHaveProperty('watchlist');
    expect(Array.isArray(res.body.watchlist)).toBe(true);
    expect(res.body).toHaveProperty('isPolling');
    expect(res.body).toHaveProperty('cachedQuotes');
  });

  it('GET /api/market/quote without symbol returns EMPTY degraded quote (never fake prices)', async () => {
    const res = await request(app.getHttpServer()).get('/api/market/quote').expect(200);

    expect(res.body).toHaveProperty('source');
    expect(['EMPTY', 'CACHE', 'TSETMC']).toContain(res.body.source);
    expect(res.body).toHaveProperty('orderBook');
    expect(Array.isArray(res.body.orderBook)).toBe(true);
    if (res.body.source === 'EMPTY') {
      expect(res.body.lastPrice).toBe(0);
      expect(res.body.degraded).toBe(true);
    }
  });

  it('POST /api/market/watch then DELETE removes symbol', async () => {
    const symbol = 'فزر';
    const watch = await request(app.getHttpServer())
      .post('/api/market/watch')
      .send({ symbol })
      .expect(200);

    expect(watch.body.ok).toBe(true);
    expect(watch.body.watchlist).toContain(symbol);

    const status = await request(app.getHttpServer()).get('/api/market/status').expect(200);
    expect(status.body.watchlist).toContain(symbol);

    const unwatch = await request(app.getHttpServer())
      .delete('/api/market/watch')
      .query({ symbol })
      .expect(200);

    expect(unwatch.body.watchlist).not.toContain(symbol);
  });

  it('GET /api/market/dossier without symbol returns an empty dossier', async () => {
    const res = await request(app.getHttpServer()).get('/api/market/dossier').expect(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.degraded).toBe(true);
    expect(res.body.trades).toEqual([]);
    expect(res.body.hasBlock).toBe(false);
    expect(res.body.indicators.rsi14).toBeNull();
    expect(res.body.narrative.summary).toBe(t('dossier', 'noServerData'));
    expect(res.body.narrative.risk).toBe('unknown');
  });

  it('GET /api/market/quote?symbol=فزر returns quote-shaped real/degraded payload', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/market/quote')
      .query({ symbol: 'فزر', force: 'true' })
      .expect(200);

    expect(res.body).toHaveProperty('symbol');
    expect(res.body).toHaveProperty('lastPrice');
    expect(res.body).toHaveProperty('orderBook');
    expect(res.body).toHaveProperty('source');
    expect(['TSETMC', 'CACHE', 'EMPTY']).toContain(res.body.source);
    // Must never invent success without source
    if (res.body.source === 'EMPTY') {
      expect(res.body.ok === false || res.body.degraded === true).toBe(true);
    }
  }, 20000);
});
