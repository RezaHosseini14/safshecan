import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Sniper Engine E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/sniper/disarm should successfully disarm the engine', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sniper/disarm')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(t('engine', 'disarmed'));
  });

  it('POST /api/sniper/arm should handle future or past target time gracefully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sniper/arm')
      .expect(200);

    // Depending on whether 08:45:00 is past or future today, arm returns success: false/true with proper message
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });

  it('POST /api/sniper/test-shot should execute manual dry run and return shot result', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sniper/test-shot')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('result');
    expect(res.body.result).toHaveProperty('shotIndex');
    expect(res.body.result).toHaveProperty('latencyMs');
    expect(res.body.result).toHaveProperty('httpStatus');
  });
});
