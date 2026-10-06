import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/bootstrap.js';

describe('NestJS Brokers & cURL E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createNestApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/presets should return available broker presets', async () => {
    const res = await request(app.getHttpServer()).get('/api/presets').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.presets)).toBe(true);
    const ids = res.body.presets.map((p: any) => p.id);
    expect(ids).toContain('tadbir');
    expect(ids).toContain('easytrader');
    expect(ids).toContain('rayan');
  });

  it('POST /api/presets/apply should apply selected preset', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/presets/apply')
      .send({ presetId: 'tadbir' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.config.order.brokerType).toBe('tadbir');
    expect(res.body.config.network.targetUrl).toContain('onlineplus');
  });

  it('POST /api/curl/parse should parse complex cURL command', async () => {
    const mockJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(
        JSON.stringify({
          unique_name: 'کاربر آزمایشی بورس',
          CustomerId: '782910',
          exp: Math.floor(Date.now() / 1000) + 7200,
        })
      )
        .toString('base64')
        .replace(/=/g, '') +
      '.signature';

    const curl = `curl 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder' \\
      -H 'Authorization: Bearer ${mockJwt}' \\
      -H 'Content-Type: application/json' \\
      --data-raw '{"Isin":"IRO1FAZR0001","Symbol":"فزر","OrderPrice":25000,"OrderQuantity":500,"OrderSide":1}'`;

    const res = await request(app.getHttpServer())
      .post('/api/curl/parse')
      .send({ curl })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.brokerInfo.id).toBe('tadbir');
    expect(res.body.accountInfo.customerTitle).toBe('کاربر آزمایشی بورس');
    expect(res.body.accountInfo.customerCode).toBe('782910');
    expect(res.body.extractedOrder.symbol).toBe('فزر');
    expect(res.body.extractedOrder.price).toBe(25000);
    expect(res.body.extractedOrder.quantity).toBe(500);
    expect(res.body.config.order.symbol).toBe('فزر');
  });

  it('POST /api/curl/parse should return 400 when cURL is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/curl/parse')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
