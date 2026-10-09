import { Injectable } from '@nestjs/common';
import { request, type Dispatcher } from 'undici';
import { ConnectionPoolService } from '../network/connection-pool.service.js';
import type { OrderTransportPort, ShotRequest, ShotResponse } from './domain/ports.js';

@Injectable()
export class UndiciOrderTransport implements OrderTransportPort {
  constructor(private readonly pool: ConnectionPoolService) {}

  public async send(shot: ShotRequest): Promise<ShotResponse> {
    const res = await request(shot.url, {
      method: shot.method as Dispatcher.HttpMethod,
      headers: shot.headers,
      body: shot.body,
      dispatcher: this.pool.getDispatcher(),
      headersTimeout: 10000,
    });
    return {
      statusCode: res.statusCode,
      body: await res.body.text(),
    };
  }

  public preWarm(targetUrl: string, headers: Record<string, string>): Promise<number> {
    return this.pool.preWarm(targetUrl, headers);
  }
}
