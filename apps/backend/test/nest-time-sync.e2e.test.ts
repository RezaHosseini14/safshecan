import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS TimeSync & Network E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/time/offset should update manual time offset', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/time/offset')
      .send({ offsetMs: -45 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status.offsetMs).toBe(-45);
    expect(res.body.status.source).toBe('manual');
  });

  it('POST /api/network/ping should test ping latency', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/network/ping')
      .send({ url: 'https://example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.pingMs).toBe('number');
  });

  it('POST /api/broker/test-connection should test socket pre-warming', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/broker/test-connection')
      .send({ url: 'https://example.com' })
      .expect(200);

    expect(res.body).toHaveProperty('success');
    expect(typeof res.body.rttMs).toBe('number');
  });
});
