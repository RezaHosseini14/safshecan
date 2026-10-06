import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { request } from 'undici';
import {
  BotConfig,
  OrderShotResult,
  SniperState,
} from '../types/index.js';
import { AppConfigService } from '../config/config.service.js';
import { NestTimeSyncService } from '../time-sync/time-sync.service.js';
import { ConnectionPoolService } from '../connection-pool/connection-pool.service.js';
import { SniperGateway } from '../websocket/sniper.gateway.js';
import { CurlParser } from '../brokers/curl-parser.js';

@Injectable()
export class SniperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SniperService.name);

  private state: SniperState = 'IDLE';
  private armTimer: NodeJS.Timeout | null = null;
  private preWarmInterval: NodeJS.Timeout | null = null;
  private clockInterval: NodeJS.Timeout | null = null;
  private isAborted = false;
  private shotResults: OrderShotResult[] = [];

  constructor(
    private readonly configService: AppConfigService,
    private readonly timeSync: NestTimeSyncService,
    private readonly connectionManager: ConnectionPoolService,
    private readonly gateway: SniperGateway
  ) {}

  onModuleInit() {
    this.startClockTicker();
    this.logger.log('✓ موتور سرخطی دقیق و تپش ساعت اتمی (Atomic Clock Ticker) فعال شد.');
  }

  onModuleDestroy() {
    this.disarm();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  public getState(): SniperState {
    return this.state;
  }

  public getResults(): OrderShotResult[] {
    return this.shotResults;
  }

  /**
   * راه‌اندازی تیکر ۱۰۰ میلی‌ثانیه‌ای ساعت اتمی برای همگام‌سازی لحظه‌ای با کلاینت‌های متصل
   */
  private startClockTicker(): void {
    this.clockInterval = setInterval(() => {
      if (!this.gateway || this.gateway.getConnectedClientsCount() === 0) return;

      const exactNow = this.timeSync.getExactNow();
      const timeStr = NestTimeSyncService.formatTime(exactNow, true);
      const targetTimeStr = this.configService.getConfig().timing.targetTime;

      this.gateway.broadcast({
        type: 'CLOCK_TICK',
        data: {
          currentExactTime: timeStr,
          timestampMs: exactNow.getTime(),
          state: this.state,
          targetTime: targetTimeStr,
        },
      });
    }, 100);
  }

  /**
   * مسلح‌سازی و آماده‌باش برای شلیک در زمان تعیین‌شده
   */
  public arm(): { success: boolean; message: string; targetDate?: Date } {
    if (this.state === 'ARMED' || this.state === 'FIRING') {
      return { success: false, message: 'موتور سرخطی در حال حاضر در حالت فعال است.' };
    }

    const config = this.configService.getConfig();
    if (!config.network.targetUrl) {
      return { success: false, message: 'آدرس اینترنتی کارگزاری تنظیم نشده است.' };
    }

    const targetDate = this.calculateTargetDate(config.timing.targetTime);
    const now = this.timeSync.getExactTimestampMs();
    const diffMs = targetDate.getTime() - now;

    if (diffMs <= 0) {
      return {
        success: false,
        message: `ساعت هدف (${config.timing.targetTime}) گذشته است. لطفاً زمان را برای آینده تنظیم کنید.`,
      };
    }

    this.isAborted = false;
    this.shotResults = [];
    this.setState('ARMED');

    // زمان‌بندی پیش‌گرمایش سوکت‌ها
    const preWarmLeadMs = (config.timing.preWarmSeconds || 12) * 1000;
    const timeUntilPreWarm = Math.max(0, diffMs - preWarmLeadMs);

    setTimeout(() => {
      if (this.state === 'ARMED' && !this.isAborted) {
        this.startPreWarming();
      }
    }, timeUntilPreWarm);

    // زمان‌بندی بیدارباش اصلی با دقت میکروثانیه
    const triggerTimestamp = targetDate.getTime() - config.timing.leadTimeMs;
    const coarseWaitMs = Math.max(0, triggerTimestamp - this.timeSync.getExactTimestampMs() - 60);

    this.armTimer = setTimeout(() => {
      if (this.isAborted) return;
      this.spinWaitAndFire(triggerTimestamp);
    }, coarseWaitMs);

    const message = `موتور سرخطی فعال شد. زمان شلیک: ${NestTimeSyncService.formatTime(targetDate, true)} (فاصله: ${Math.round(diffMs / 1000)} ثانیه)`;
    this.logger.log(message);

    return {
      success: true,
      message,
      targetDate,
    };
  }

  /**
   * لغو آماده‌باش
   */
  public disarm(): { success: boolean; message: string } {
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
    setTimeout(() => {
      if (this.state === 'CANCELLED') {
        this.setState('IDLE');
      }
    }, 1500);

    const msg = 'موتور سرخطی با موفقیت غیرفعال شد.';
    this.logger.log(msg);
    return { success: true, message: msg };
  }

  /**
   * شلیک دستی آزمایشی (Test Shot / Dry Run)
   */
  public async testManualShoot(): Promise<OrderShotResult> {
    const config = this.configService.getConfig();
    const payload = this.preparePayload(config);
    const headers = this.prepareHeaders(config);

    this.logger.log(`ارسال شلیک آزمایشی به ${config.network.targetUrl}...`);
    const shot = await this.executeSingleShot(1, payload, headers, config);

    this.shotResults.unshift(shot);
    this.gateway.broadcast({
      type: 'ORDER_SHOT',
      data: shot,
    });
    this.gateway.broadcast({
      type: 'SHOT_LOG',
      data: {
        level: shot.success ? 'success' : 'warn',
        text: `[شلیک آزمایشی] کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${shot.errorMessage || (shot.trackingCode ? `کد رهگیری: ${shot.trackingCode}` : 'پاسخ دریافت شد')}`,
        shot,
      },
    });

    return shot;
  }

  private startPreWarming(): void {
    this.setState('PRE_WARMING');
    const config = this.configService.getConfig();

    this.broadcastLog('info', '🔥 آغاز پیش‌گرمایش سوکت و هندشیک SSL با کارگزاری...');
    this.connectionManager.preWarm(config.network.targetUrl, config.network.headers);

    this.preWarmInterval = setInterval(() => {
      if (this.isAborted || this.state === 'FIRING') {
        if (this.preWarmInterval) clearInterval(this.preWarmInterval);
        return;
      }
      this.connectionManager.preWarm(config.network.targetUrl, config.network.headers);
    }, 3000);
  }

  private spinWaitAndFire(triggerTimestamp: number): void {
    if (this.preWarmInterval) {
      clearInterval(this.preWarmInterval);
      this.preWarmInterval = null;
    }

    const check = () => {
      if (this.isAborted) return;

      const current = this.timeSync.getExactTimestampMs();
      if (current >= triggerTimestamp) {
        this.startBurstFire();
      } else {
        setImmediate(check);
      }
    };

    check();
  }

  private async startBurstFire(): Promise<void> {
    this.setState('FIRING');
    const config = this.configService.getConfig();

    this.broadcastLog(
      'warn',
      `🚀 شلیک رگباری آغاز شد! تعداد: ${config.timing.burstCount} | فاصله: ${config.timing.burstIntervalMs}ms`
    );

    const payload = this.preparePayload(config);
    const headers = this.prepareHeaders(config);
    const { burstCount, burstIntervalMs, stopOnFirstSuccess } = config.timing;

    let hasSuccess = false;

    for (let i = 1; i <= burstCount; i++) {
      if (this.isAborted || (hasSuccess && stopOnFirstSuccess)) {
        break;
      }

      this.executeSingleShot(i, payload, headers, config).then((result) => {
        this.shotResults.push(result);
        this.gateway.broadcast({
          type: 'ORDER_SHOT',
          data: result,
        });

        this.gateway.broadcast({
          type: 'SHOT_LOG',
          data: {
            level: result.success ? 'success' : 'warn',
            text: `[شلیک ${result.shotIndex}] کد ${result.httpStatus} | تاخیر: ${result.latencyMs}ms | ${result.errorMessage || (result.trackingCode ? `کد رهگیری: ${result.trackingCode}` : 'پاسخ دریافت شد')}`,
            shot: result,
          },
        });

        if (result.success) {
          hasSuccess = true;
          if (stopOnFirstSuccess) {
            this.isAborted = true;
          }
          this.broadcastLog(
            'success',
            `🎯 شلیک شماره ${result.shotIndex} موفق شد! کد رهگیری: ${result.trackingCode || 'دریافت شد'} ${stopOnFirstSuccess ? '- مدارشکن فعال شد.' : ''}`
          );
        }
      });

      if (i < burstCount && burstIntervalMs > 0 && !this.isAborted) {
        await this.delay(burstIntervalMs);
      }
    }

    setTimeout(() => {
      this.setState('COMPLETED');
      this.broadcastLog('info', '🏁 عملیات سرخطی پایان یافت.');
      this.gateway.broadcast({
        type: 'SNIPER_SUMMARY',
        data: { results: this.shotResults },
      });
    }, 2500);
  }

  private async executeSingleShot(
    index: number,
    payload: string,
    headers: Record<string, string>,
    config: BotConfig
  ): Promise<OrderShotResult> {
    const sendTime = this.timeSync.getExactNow();
    const sendTimestampStr = NestTimeSyncService.formatTime(sendTime, true);
    const t0 = Date.now();

    try {
      const res = await request(config.network.targetUrl, {
        method: config.network.method || 'POST',
        headers,
        body: payload,
        dispatcher: this.connectionManager.getDispatcher(),
        headersTimeout: 10000,
      });

      const responseBody = await res.body.text();
      const latencyMs = Date.now() - t0;
      const respTime = this.timeSync.getExactNow();
      const respTimestampStr = NestTimeSyncService.formatTime(respTime, true);

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
        responseTimestamp: NestTimeSyncService.formatTime(respTime, true),
        latencyMs,
        httpStatus: 0,
        success: false,
        rawResponse: '',
        errorMessage: err.message || 'خطای شبکه در ارسال درخواست',
      };
    }
  }

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

  private preparePayload(config: BotConfig): string {
    return CurlParser.injectVariables(config.network.bodyTemplate, {
      symbol: config.order.symbol,
      price: config.order.price,
      quantity: config.order.quantity,
    });
  }

  private prepareHeaders(config: BotConfig): Record<string, string> {
    const headers = { ...config.network.headers };
    if (config.network.cookies) {
      headers['Cookie'] = config.network.cookies;
    }
    return headers;
  }

  private calculateTargetDate(targetTimeStr: string): Date {
    const now = this.timeSync.getExactNow();
    const [timePart, msPart = '0'] = targetTimeStr.split('.');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const target = new Date(now);
    target.setHours(hours || 8, minutes || 45, seconds || 0, Number(msPart) || 0);

    return target;
  }

  private setState(newState: SniperState): void {
    this.state = newState;
    this.gateway.broadcast({
      type: 'STATE_CHANGE',
      data: {
        state: this.state,
        timeSync: this.timeSync.getStatus(),
      },
    });
  }

  private broadcastLog(level: 'info' | 'warn' | 'success' | 'error', text: string): void {
    this.logger.log(`[${level.toUpperCase()}] ${text}`);
    this.gateway.broadcast({
      type: 'SHOT_LOG',
      data: {
        level,
        text,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
