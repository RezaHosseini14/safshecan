import http from 'node:http';
import { AddressInfo } from 'node:net';

export interface MockBrokerOptions {
  marketOpenTimestamp: number; // زمان دقیق میلی‌ثانیه‌ای بازگشایی بازار (مثلاً ساعت ۰۸:۴۵:۰۰)
  simulatedPingMs: number;      // پینگ رفت و برگشت شبیه‌سازی شده
  jitterMs: number;             // نوسان تصادفی پینگ (± Jitter)
  rateLimitMinIntervalMs?: number; // حداقل فاصله مجاز بین درخواست‌ها (پیش‌فرض ۱۵ میلی‌ثانیه)
}

export interface MockOrderArrival {
  orderId: string;
  arrivalTime: number;
  diffFromMarketOpenMs: number;
  status: 'REJECTED_EARLY' | 'ACCEPTED' | 'RATE_LIMITED';
  queueRank?: number;
  statusCode: number;
  message: string;
}

export class MockBrokerServer {
  private server: http.Server | null = null;
  private port = 0;
  private options: MockBrokerOptions;
  private receivedOrders: MockOrderArrival[] = [];
  private lastRequestTime = 0;
  private currentQueuePosition = 1;

  constructor(options: MockBrokerOptions) {
    this.options = options;
  }

  public updateOptions(newOptions: Partial<MockBrokerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  public resetStats(): void {
    this.receivedOrders = [];
    this.currentQueuePosition = 1;
    this.lastRequestTime = 0;
  }

  public getReceivedOrders(): MockOrderArrival[] {
    return this.receivedOrders;
  }

  public async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // شبیه‌سازی تاخیر رفت پکت در شبکه (Half-RTT + Jitter)
        const jitter = (Math.random() * 2 - 1) * this.options.jitterMs;
        const halfRtt = Math.max(1, Math.round(this.options.simulatedPingMs / 2 + jitter));

        await new Promise((r) => setTimeout(r, halfRtt));

        const now = Date.now();
        const diffFromOpen = now - this.options.marketOpenTimestamp;
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        // ۱. بررسی نرخ ارسال (Rate Limiting)
        const minInterval = this.options.rateLimitMinIntervalMs ?? 15;
        if (this.lastRequestTime > 0 && now - this.lastRequestTime < minInterval) {
          const result: MockOrderArrival = {
            orderId,
            arrivalTime: now,
            diffFromMarketOpenMs: diffFromOpen,
            status: 'RATE_LIMITED',
            statusCode: 429,
            message: 'تعداد درخواست‌ها بیش از حد مجاز است (Rate Limit Exceeded - 429)',
          };
          this.receivedOrders.push(result);
          this.lastRequestTime = now;

          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ isSuccess: false, errorCode: 429, errorMessage: result.message }));
          return;
        }

        this.lastRequestTime = now;

        // ۲. بررسی زمان رسیدن به هسته معاملات
        if (diffFromOpen < 0) {
          // زودتر از ساعت ۰۸:۴۵:۰۰ رسیده (حتی ۱ میلی‌ثانیه قبل) ➔ رد توسط هسته
          const result: MockOrderArrival = {
            orderId,
            arrivalTime: now,
            diffFromMarketOpenMs: diffFromOpen,
            status: 'REJECTED_EARLY',
            statusCode: 400,
            message: `خارج از ساعات مجاز معاملات (${Math.abs(diffFromOpen)}ms زودهنگام)`,
          };
          this.receivedOrders.push(result);

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ isSuccess: false, errorCode: 400, errorMessage: result.message }));
          return;
        }

        // ۳. پذیرش سفارش و محاسبه رتبه در صف خرید بر اساس سرعت رسیدن به هسته
        let rank = 1;
        if (diffFromOpen <= 12) {
          rank = Math.floor(Math.random() * 5) + 1; // رتبه ۱ الی ۵ (طلایی 🥇)
        } else if (diffFromOpen <= 35) {
          rank = Math.floor(Math.random() * 20) + 6; // رتبه ۶ الی ۲۵ 🥈
        } else if (diffFromOpen <= 80) {
          rank = Math.floor(Math.random() * 75) + 26; // رتبه ۲۶ الی ۱۰۰ 🥉
        } else {
          rank = 100 + Math.floor(diffFromOpen * 2.5); // رتبه‌های بالای ۱۰۰
        }

        const result: MockOrderArrival = {
          orderId,
          arrivalTime: now,
          diffFromMarketOpenMs: diffFromOpen,
          status: 'ACCEPTED',
          queueRank: rank,
          statusCode: 200,
          message: `سفارش در صف خرید ثبت شد. رتبه در صف: ${rank}`,
        };
        this.receivedOrders.push(result);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            isSuccess: true,
            errorCode: 0,
            result: {
              orderId,
              trackingCode: orderId,
              queueRank: rank,
              message: result.message,
            },
          })
        );
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server?.address() as AddressInfo;
        this.port = addr.port;
        resolve(this.port);
      });

      this.server.on('error', reject);
    });
  }

  public getUrl(): string {
    return `http://127.0.0.1:${this.port}/api/Order/SendOrder`;
  }

  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server?.close(() => resolve());
      });
    }
  }
}
