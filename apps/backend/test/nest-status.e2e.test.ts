import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Status & Reports E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/status should return system status, bot config, presets, and engine state', async () => {
    const res = await request(app.getHttpServer()).get('/api/status').expect(200);

    expect(res.body).toHaveProperty('config');
    expect(res.body).toHaveProperty('state');
    expect(res.body).toHaveProperty('timeSync');
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('presets');
    expect(Array.isArray(res.body.presets)).toBe(true);
    expect(res.body.presets.length).toBeGreaterThan(0);
    expect(res.body.config).toHaveProperty('order');
    expect(res.body.config).toHaveProperty('network');
    expect(res.body.config).toHaveProperty('timing');
  });

  it('GET /api/reports should return shot history, engine state, and timeSync', async () => {
    const res = await request(app.getHttpServer()).get('/api/reports').expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body).toHaveProperty('state');
    expect(res.body).toHaveProperty('timeSync');
  });
});
