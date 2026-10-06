import { Agent, request, Dispatcher } from 'undici';

export class ConnectionManager {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      keepAliveTimeout: 60000,
      keepAliveMaxTimeout: 120000,
      pipelining: 0,
      connections: 50,
      connect: {
        keepAlive: true,
        noDelay: true, // غیرفعال کردن الگوریتم نِگِل برای ارسال آنی بایت‌ها
        timeout: 10000,
      },
    });
  }

  public getDispatcher(): Dispatcher {
    return this.agent;
  }

  /**
   * پیش‌گرمایش کانکشن (Pre-warming):
   * برقراری ارتباط TCP و TLS Handshake با سرور کارگزاری پیش از فرارسیدن زمان هدف،
   * تا در لحظه شلیک اصلی، تاخیر برقراری اتصال SSL حذف شود (صفر میلی‌ثانیه).
   */
  public async preWarm(targetUrl: string, headers: Record<string, string> = {}): Promise<number> {
    try {
      const urlObj = new URL(targetUrl);
      const origin = urlObj.origin;
      const t0 = Date.now();

      // ارسال درخواست سبک OPTIONS یا HEAD به ریشه دامنه کارگزاری
      const res = await request(origin, {
        method: 'HEAD',
        dispatcher: this.agent,
        headers: {
          'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Connection': 'keep-alive',
          'Accept': '*/*',
        },
        headersTimeout: 5000,
      });

      // مصرف کردن کامل بدنه پاسخ برای آزاد شدن سوکت در pool
      await res.body.dump();
      const latency = Date.now() - t0;
      return latency;
    } catch (err) {
      // در صورت عدم پشتیبانی HEAD، مسیر اصلی را با GET ساده چک می‌کنیم
      try {
        const t0 = Date.now();
        const res = await request(targetUrl, {
          method: 'OPTIONS',
          dispatcher: this.agent,
          headers: {
            'Connection': 'keep-alive',
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

  /**
   * تست پینگ دقیق تا سرور کارگزاری
   */
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
      // اگر خطای ۴۰۵ یا ۴۰۳ بود هم پینگ رفت و برگشت محاسبه شده است
      return Date.now() - t0;
    }
  }

  public async destroy(): Promise<void> {
    await this.agent.destroy();
  }
}
