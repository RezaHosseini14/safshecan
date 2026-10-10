import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import { Agent, request, Dispatcher } from 'undici';

@Injectable()
export class ConnectionPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      keepAliveTimeout: 60000,
      keepAliveMaxTimeout: 120000,
      pipelining: 0,
      connections: 50,
      connect: {
        keepAlive: true,
        noDelay: true, // غیرفعال‌سازی الگوریتم نِگِل برای ارسال آنی پکت‌ها
        timeout: 10000,
      },
    });
    this.logger.log(t('logs', 'poolReady'));
  }

  public getDispatcher(): Dispatcher {
    return this.agent;
  }

  public async preWarm(targetUrl: string, headers: Record<string, string> = {}): Promise<number> {
    try {
      const urlObj = new URL(targetUrl);
      const origin = urlObj.origin;
      const t0 = Date.now();

      const res = await request(origin, {
        method: 'HEAD',
        dispatcher: this.agent,
        headers: {
          'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Connection: 'keep-alive',
          Accept: '*/*',
        },
        headersTimeout: 5000,
      });

      await res.body.dump();
      const latency = Date.now() - t0;
      this.logger.log(t('logs', 'prewarmOk', { latency }));
      return latency;
    } catch {
      try {
        const t0 = Date.now();
        const res = await request(targetUrl, {
          method: 'OPTIONS',
          dispatcher: this.agent,
          headers: {
            Connection: 'keep-alive',
          },
          headersTimeout: 5000,
        });
        await res.body.dump();
        return Date.now() - t0;
      } catch {
        return -1;
      }
    }
  }

  public async pingBroker(targetUrl: string): Promise<number> {
    const t0 = Date.now();
    try {
      const res = await request(targetUrl, {
        method: 'OPTIONS',
        dispatcher: this.agent,
        headersTimeout: 4000,
      });
      await res.body.dump();
      return Date.now() - t0;
    } catch {
      return Date.now() - t0;
    }
  }

  async onModuleDestroy() {
    this.logger.log(t('logs', 'poolClose'));
    await this.agent.destroy();
  }
}
