import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Symbols E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/symbols should return list of TSE symbols', async () => {
    const res = await request(app.getHttpServer()).get('/api/symbols').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const first = res.body[0];
    expect(first).toHaveProperty('symbol');
    expect(first).toHaveProperty('name');
  });

  it('GET /api/symbols?q=فزر should filter by query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/symbols')
      .query({ q: 'فزر' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const hasFazr = res.body.some((s: any) => s.symbol.includes('فزر') || s.name.includes('فزر'));
    expect(hasFazr).toBe(true);
  });

  it('GET /api/symbols?q=XYZNONEXISTENT should return empty array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/symbols')
      .query({ q: 'XYZNONEXISTENT999' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('GET /api/symbols/ipos should return list of initial public offerings (عرضه‌های اولیه)', async () => {
    const res = await request(app.getHttpServer()).get('/api/symbols/ipos').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((s: any) => s.isIpo === true)).toBe(true);
  });

  it('GET /api/symbols/status should return sync status and counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/symbols/status').expect(200);

    expect(res.body).toHaveProperty('totalSymbols');
    expect(res.body).toHaveProperty('ipoCount');
    expect(res.body.totalSymbols).toBeGreaterThan(0);
    expect(res.body.ipoCount).toBeGreaterThan(0);
  });

  it('GET /api/symbols?onlyIpo=true should return only IPO symbols', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/symbols')
      .query({ onlyIpo: 'true' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((s: any) => s.isIpo === true)).toBe(true);
  });
});
