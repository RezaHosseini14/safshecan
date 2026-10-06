import { EventEmitter } from 'node:events';
import { request } from 'undici';
import {
  BotConfig,
  OrderShotResult,
  SniperState,
  SniperTimingConfig,
} from '../types/index.js';
import { TimeSyncService } from './time-sync.js';
import { ConnectionManager } from './connection-pool.js';
import { CurlParser } from '../brokers/curl-parser.js';

export class SniperEngine extends EventEmitter {
  private config: BotConfig;
  private timeSync: TimeSyncService;
  private connectionManager: ConnectionManager;
  private state: SniperState = 'IDLE';

  private armTimer: NodeJS.Timeout | null = null;
  private preWarmInterval: NodeJS.Timeout | null = null;
  private isAborted = false;
  private shotResults: OrderShotResult[] = [];

  constructor(
    config: BotConfig,
    timeSync: TimeSyncService,
    connectionManager: ConnectionManager
  ) {
    super();
    this.config = config;
    this.timeSync = timeSync;
    this.connectionManager = connectionManager;
  }

  public getState(): SniperState {
    return this.state;
  }

  public getResults(): OrderShotResult[] {
    return this.shotResults;
  }

  public updateConfig(newConfig: BotConfig): void {
    this.config = newConfig;
    this.emit('config_updated', this.config);
  }

  /**
   * آماده‌باش برای شلیک در زمان تعیین‌شده (Arming)
   */
  public arm(): { success: boolean; message: string; targetDate?: Date } {
    if (this.state === 'ARMED' || this.state === 'FIRING') {
      return { success: false, message: 'موتور سرخطی در حال حاضر در حالت فعال است.' };
    }

    if (!this.config.network.targetUrl) {
      return { success: false, message: 'آدرس اینترنتی کارگزاری تنظیم نشده است.' };
    }

    const targetDate = this.calculateTargetDate(this.config.timing.targetTime);
    const now = this.timeSync.getExactTimestampMs();
    const diffMs = targetDate.getTime() - now;

    if (diffMs <= 0) {
      return {
        success: false,
        message: `ساعت هدف (${this.config.timing.targetTime}) گذشته است. لطفاً زمان را برای آینده تنظیم کنید.`,
      };
    }

    this.isAborted = false;
    this.shotResults = [];
    this.setState('ARMED');

    // زمان‌بندی پیش‌گرمایش (Pre-warm)
    const preWarmLeadMs = (this.config.timing.preWarmSeconds || 12) * 1000;
    const timeUntilPreWarm = Math.max(0, diffMs - preWarmLeadMs);

    setTimeout(() => {
      if (this.state === 'ARMED' && !this.isAborted) {
        this.startPreWarming();
      }
    }, timeUntilPreWarm);

    // زمان‌بندی بیدارباش اصلی با دقت میکروثانیه
    const triggerTimestamp = targetDate.getTime() - this.config.timing.leadTimeMs;
    const coarseWaitMs = Math.max(0, triggerTimestamp - this.timeSync.getExactTimestampMs() - 60);

    this.armTimer = setTimeout(() => {
      if (this.isAborted) return;
      this.spinWaitAndFire(triggerTimestamp);
    }, coarseWaitMs);

    return {
      success: true,
      message: `موتور سرخطی فعال شد. زمان شلیک: ${TimeSyncService.formatTime(targetDate, true)} (فاصله: ${Math.round(diffMs / 1000)} ثانیه)`,
      targetDate,
    };
  }

  /**
   * لغو آماده‌باش
   */
  public disarm(): void {
    this.isAborted = true;
    if (this.armTimer) {
      clearTimeout(this.armTimer);
      this.armTimer = null;
    }
    if (this.preWarmInterval) {
      clearInterval(this.preWarmInterval);
      this.preWarmInterval = null;
    }
    this.setState('CANCELLED');
    setTimeout(() => this.setState('IDLE'), 1500);
  }

  /**
   * شلیک دستی آزمایشی (برای تست پینگ و بدنه درخواست بدون منتظر ماندن برای ساعت ۸:۴۵)
   */
  public async testManualShoot(): Promise<OrderShotResult> {
    const payload = this.preparePayload();
    const headers = this.prepareHeaders();
    return await this.executeSingleShot(1, payload, headers);
  }

  /**
   * شروع فرآیند گرم نگه‌داشتن سوکت TCP / TLS قبل از رسیدن به زمان هدف
   */
  private startPreWarming(): void {
    this.setState('PRE_WARMING');
    this.emit('log', { level: 'info', text: '🔥 آغاز پیش‌گرمایش سوکت و هندشیک SSL با کارگزاری...' });

    // یک بار در ابتدا سوکت گرم می‌شود
    this.connectionManager.preWarm(this.config.network.targetUrl, this.config.network.headers);

    // تا فرارسیدن ساعت هدف، هر ۳ ثانیه یک درخواست تپش قلب سبک ارسال می‌شود
    this.preWarmInterval = setInterval(() => {
      if (this.isAborted || this.state === 'FIRING') {
        if (this.preWarmInterval) clearInterval(this.preWarmInterval);
        return;
      }
      this.connectionManager.preWarm(this.config.network.targetUrl, this.config.network.headers);
    }, 3000);
  }

  /**
   * حلقه انتظار دقیق (Spin-wait) با دقت میلی‌ثانیه برای حذف نوسان تایمر سیستم‌عامل
   */
  private spinWaitAndFire(triggerTimestamp: number): void {
    if (this.preWarmInterval) {
      clearInterval(this.preWarmInterval);
      this.preWarmInterval = null;
    }

    const check = () => {
      if (this.isAborted) return;

      const current = this.timeSync.getExactTimestampMs();
      if (current >= triggerTimestamp) {
        // فرارسیدن لحظه طلایی! شلیک رگباری آغاز می‌شود
        this.startBurstFire();
      } else {
        // برای باقی‌مانده کمتر از ۱۰ میلی‌ثانیه از setImmediate استفاده می‌شود
        setImmediate(check);
      }
    };

    check();
  }

  /**
   * اجرای شلیک رگباری سفارشات (Burst Order Placement)
   */
  private async startBurstFire(): Promise<void> {
    this.setState('FIRING');
    this.emit('log', {
      level: 'warn',
      text: `🚀 شلیک رگباری آغاز شد! تعداد شلیک: ${this.config.timing.burstCount} | فاصله: ${this.config.timing.burstIntervalMs}ms`,
    });

    const payload = this.preparePayload();
    const headers = this.prepareHeaders();
    const { burstCount, burstIntervalMs, stopOnFirstSuccess } = this.config.timing;

    let hasSuccess = false;

    for (let i = 1; i <= burstCount; i++) {
      if (this.isAborted || (hasSuccess && stopOnFirstSuccess)) {
        break;
      }

      // ارسال هر شلیک به صورت async و بدون مسدودسازی گام بعدی
      this.executeSingleShot(i, payload, headers).then((result) => {
        this.shotResults.push(result);
        this.emit('shot_result', result);

        if (result.success) {
          hasSuccess = true;
          if (stopOnFirstSuccess) {
            this.isAborted = true;
          }
          this.emit('log', {
            level: 'success',
            text: `🎯 شلیک شماره ${result.shotIndex} موفق شد! کد رهگیری: ${result.trackingCode || 'دریافت شد'} ${stopOnFirstSuccess ? '- مدارشکن فعال شد و شلیک‌های بعدی متوقف شدند.' : ''}`,
          });
        }
      });

      // فاصله زمانی بین شلیک‌های رگباری
      if (i < burstCount && burstIntervalMs > 0 && !this.isAborted) {
        await this.delay(burstIntervalMs);
      }
    }

    // منتظر دریافت آخرین پاسخ‌ها می‌مانیم
    setTimeout(() => {
      this.setState('COMPLETED');
      this.emit('log', { level: 'info', text: '🏁 عملیات سرخطی پایان یافت.' });
      this.emit('sniper_completed', this.shotResults);
    }, 2500);
  }

  /**
   * ارسال یک شلیک سفارش منفرد و پردازش پاسخ سرور کارگزاری
   */
  private async executeSingleShot(
    index: number,
    payload: string,
    headers: Record<string, string>
  ): Promise<OrderShotResult> {
    const sendTime = this.timeSync.getExactNow();
    const sendTimestampStr = TimeSyncService.formatTime(sendTime, true);
    const t0 = Date.now();

    try {
      const res = await request(this.config.network.targetUrl, {
        method: this.config.network.method || 'POST',
        headers,
        body: payload,
        dispatcher: this.connectionManager.getDispatcher(),
        headersTimeout: 10000,
      });

      const responseBody = await res.body.text();
      const latencyMs = Date.now() - t0;
      const respTime = this.timeSync.getExactNow();
      const respTimestampStr = TimeSyncService.formatTime(respTime, true);

      const analysis = this.analyzeBrokerResponse(res.statusCode, responseBody);

      return {
        shotIndex: index,
        timestamp: sendTimestampStr,
        responseTimestamp: respTimestampStr,
        latencyMs,
        httpStatus: res.statusCode,
        success: analysis.isSuccess,
        trackingCode: analysis.trackingCode,
        rawResponse: responseBody,
        errorMessage: analysis.errorMessage,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const respTime = this.timeSync.getExactNow();
      return {
        shotIndex: index,
        timestamp: sendTimestampStr,
        responseTimestamp: TimeSyncService.formatTime(respTime, true),
        latencyMs,
        httpStatus: 0,
        success: false,
        rawResponse: '',
        errorMessage: err.message || 'Network error',
      };
    }
  }

  /**
   * تجزیه هوشمند پاسخ کارگزاری برای تشخیص موفقیت، خطا یا کد رهگیری
   */
  private analyzeBrokerResponse(
    statusCode: number,
    rawText: string
  ): { isSuccess: boolean; trackingCode?: string; errorMessage?: string } {
    let isSuccess = false;
    let trackingCode: string | undefined;
    let errorMessage: string | undefined;

    if (statusCode >= 200 && statusCode < 300) {
      try {
        const json = JSON.parse(rawText);

        // تدبیر پرداز / آنلاین پلاس
        if (json.IsSuccessful === true || json.IsSuccess === true || json.ErrorCode === 0) {
          isSuccess = true;
          trackingCode =
            json.Result?.OrderId ||
            json.Result?.TrackingNumber ||
            json.Result?.OrderNumber ||
            json.OrderId ||
            json.OrderNumber;
        }

        // ایزی‌تریدر مفید
        if (json.isSuccess === true || json.statusCode === 200) {
          isSuccess = true;
          trackingCode = json.data?.orderId || json.data?.trackingCode || json.orderId;
        }

        // رایان بورس
        if (json.Success === true || json.Status === 1) {
          isSuccess = true;
          trackingCode = json.TrackingNumber || json.OrderId || json.Id;
        }

        // سایر پاسخ‌های استاندارد
        if (!isSuccess && (json.success === true || json.status === 'ok' || json.status === 1)) {
          isSuccess = true;
          trackingCode = json.orderId || json.trackingCode || json.id;
        }

        if (!isSuccess) {
          errorMessage =
            json.ErrorMessage ||
            json.Message ||
            json.ErrorDescription ||
            json.error ||
            json.title ||
            rawText.slice(0, 150);
        }
      } catch {
        // در صورتی که خروجی متن ساده باشد
        if (
          rawText.includes('ثبت شد') ||
          rawText.includes('موفق') ||
          rawText.includes('success')
        ) {
          isSuccess = true;
        } else {
          errorMessage = rawText.slice(0, 150);
        }
      }
    } else {
      isSuccess = false;
      errorMessage = `کد خطای HTTP ${statusCode}`;
      try {
        const json = JSON.parse(rawText);
        if (json.Message || json.ErrorMessage || json.error) {
          errorMessage += `: ${json.Message || json.ErrorMessage || json.error}`;
        }
      } catch {}
    }

    return { isSuccess, trackingCode, errorMessage };
  }

  private preparePayload(): string {
    return CurlParser.injectVariables(this.config.network.bodyTemplate, {
      symbol: this.config.order.symbol,
      price: this.config.order.price,
      quantity: this.config.order.quantity,
    });
  }

  private prepareHeaders(): Record<string, string> {
    const headers = { ...this.config.network.headers };
    if (this.config.network.cookies) {
      headers['Cookie'] = this.config.network.cookies;
    }
    return headers;
  }

  private calculateTargetDate(targetTimeStr: string): Date {
    // فرمت ورودی: "08:45:00.000" یا "08:45:00"
    const now = this.timeSync.getExactNow();
    const [timePart, msPart = '0'] = targetTimeStr.split('.');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const target = new Date(now);
    target.setHours(hours || 8, minutes || 45, seconds || 0, Number(msPart) || 0);

    return target;
  }

  private setState(newState: SniperState): void {
    this.state = newState;
    this.emit('state_changed', newState);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
