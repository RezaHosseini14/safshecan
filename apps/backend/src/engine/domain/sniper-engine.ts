import type { BotConfig, OrderShotResult, SniperState } from '@saf-shekan/core';
import { formatExactTime } from '../../shared/time/format-time.js';
import { analyzeBrokerResponse } from './broker-response.js';
import { fillOrderTemplate } from './fill-order-template.js';
import type { ShotSnapshot, SniperPorts } from './ports.js';
import { shouldStopBurst } from './shot-policy.js';

export class SniperEngine {
  private state: SniperState = 'IDLE';
  private armTimer: NodeJS.Timeout | null = null;
  private preWarmInterval: NodeJS.Timeout | null = null;
  private isAborted = false;
  private shotResults: OrderShotResult[] = [];

  constructor(private readonly ports: SniperPorts) {}

  public getState(): SniperState {
    return this.state;
  }

  public getResults(): OrderShotResult[] {
    return this.shotResults;
  }

  public arm(): { success: boolean; message: string; targetDate?: Date } {
    if (this.state === 'ARMED' || this.state === 'FIRING') {
      return { success: false, message: 'موتور سرخطی در حال حاضر در حالت فعال است.' };
    }

    const config = this.ports.readConfig();
    if (!config.network.targetUrl) {
      return { success: false, message: 'آدرس اینترنتی کارگزاری تنظیم نشده است.' };
    }

    const targetDate = this.calculateTargetDate(config.timing.targetTime);
    const now = this.ports.clock.getExactTimestampMs();
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

    const preWarmLeadMs = (config.timing.preWarmSeconds || 12) * 1000;
    const timeUntilPreWarm = Math.max(0, diffMs - preWarmLeadMs);

    setTimeout(() => {
      if (this.state === 'ARMED' && !this.isAborted) {
        this.startPreWarming();
      }
    }, timeUntilPreWarm);

    const triggerTimestamp = targetDate.getTime() - config.timing.leadTimeMs;
    const coarseWaitMs = Math.max(0, triggerTimestamp - this.ports.clock.getExactTimestampMs() - 60);

    this.armTimer = setTimeout(() => {
      if (this.isAborted) return;
      this.spinWaitAndFire(triggerTimestamp);
    }, coarseWaitMs);

    const message = `موتور سرخطی فعال شد. زمان شلیک: ${formatExactTime(targetDate, true)} (فاصله: ${Math.round(diffMs / 1000)} ثانیه)`;
    return { success: true, message, targetDate };
  }

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
      if (this.state === 'CANCELLED') this.setState('IDLE');
    }, 1500);

    return { success: true, message: 'موتور سرخطی با موفقیت غیرفعال شد.' };
  }

  public async testManualShoot(): Promise<OrderShotResult> {
    const config = this.ports.readConfig();
    const shot = await this.executeSingleShot(1, this.preparePayload(config), this.prepareHeaders(config), config);
    this.shotResults.unshift(shot);
    this.ports.broadcaster.broadcast({ type: 'ORDER_SHOT', data: shot });
    this.ports.broadcaster.broadcast({
      type: 'SHOT_LOG',
      data: {
        level: shot.success ? 'success' : 'warn',
        text: this.shotText('شلیک آزمایشی', shot),
        shot,
      },
    });
    return shot;
  }

  public stopClock(): void {
    this.disarm();
  }

  private startPreWarming(): void {
    this.setState('PRE_WARMING');
    const config = this.ports.readConfig();
    this.broadcastLog('info', '🔥 آغاز پیش‌گرمایش سوکت و هندشیک SSL با کارگزاری...');
    void this.ports.transport.preWarm(config.network.targetUrl, config.network.headers);

    this.preWarmInterval = setInterval(() => {
      if (this.isAborted || this.state === 'FIRING') {
        if (this.preWarmInterval) clearInterval(this.preWarmInterval);
        return;
      }
      void this.ports.transport.preWarm(config.network.targetUrl, config.network.headers);
    }, 3000);
  }

  private spinWaitAndFire(triggerTimestamp: number): void {
    if (this.preWarmInterval) {
      clearInterval(this.preWarmInterval);
      this.preWarmInterval = null;
    }

    const check = () => {
      if (this.isAborted) return;
      const current = this.ports.clock.getExactTimestampMs();
      if (current >= triggerTimestamp) {
        void this.startBurstFire();
      } else {
        setImmediate(check);
      }
    };

    check();
  }

  private async startBurstFire(): Promise<void> {
    this.setState('FIRING');
    const config = this.ports.readConfig();
    this.broadcastLog(
      'warn',
      `🚀 شلیک رگباری آغاز شد! تعداد: ${config.timing.burstCount} | فاصله: ${config.timing.burstIntervalMs}ms`
    );

    const payload = this.preparePayload(config);
    const headers = this.prepareHeaders(config);
    const { burstCount, burstIntervalMs, stopOnFirstSuccess } = config.timing;
    let confirmedFill = false;

    for (let i = 1; i <= burstCount; i++) {
      if (
        shouldStopBurst({
          aborted: this.isAborted,
          confirmedFill,
          stopOnFirstSuccess,
          antiDoubleSpend: config.order.antiDoubleSpend,
        })
      ) {
        break;
      }

      void this.executeSingleShot(i, payload, headers, config).then((result) => {
        this.shotResults.push(result);
        this.ports.broadcaster.broadcast({ type: 'ORDER_SHOT', data: result });
        this.ports.broadcaster.broadcast({
          type: 'SHOT_LOG',
          data: {
            level: result.success ? 'success' : 'warn',
            text: this.shotText(`شلیک ${result.shotIndex}`, result),
            shot: result,
          },
        });

        if (result.success) {
          confirmedFill = true;
          if (stopOnFirstSuccess || config.order.antiDoubleSpend) {
            this.isAborted = true;
          }
          this.broadcastLog(
            'success',
            `🎯 شلیک شماره ${result.shotIndex} موفق شد! کد رهگیری: ${result.trackingCode || 'دریافت شد'} ${
              stopOnFirstSuccess || config.order.antiDoubleSpend ? '- مدارشکن فعال شد.' : ''
            }`
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
      this.ports.broadcaster.broadcast({
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
    const sendTime = this.ports.clock.getExactNow();
    const sendTimestampStr = formatExactTime(sendTime, true);
    const t0 = Date.now();

    try {
      const res = await this.ports.transport.send({
        url: config.network.targetUrl,
        method: config.network.method || 'POST',
        headers,
        body: payload,
      });
      const latencyMs = Date.now() - t0;
      const analysis = analyzeBrokerResponse(res.statusCode, res.body);
      return {
        shotIndex: index,
        timestamp: sendTimestampStr,
        responseTimestamp: formatExactTime(this.ports.clock.getExactNow(), true),
        latencyMs,
        httpStatus: res.statusCode,
        success: analysis.isSuccess,
        trackingCode: analysis.trackingCode,
        rawResponse: res.body,
        errorMessage: analysis.errorMessage,
        queueRank: analysis.queueRank,
        ...this.orderSnapshot(config),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطای شبکه در ارسال درخواست';
      return {
        shotIndex: index,
        timestamp: sendTimestampStr,
        responseTimestamp: formatExactTime(this.ports.clock.getExactNow(), true),
        latencyMs: Date.now() - t0,
        httpStatus: 0,
        success: false,
        rawResponse: '',
        errorMessage: message,
        ...this.orderSnapshot(config),
      };
    }
  }

  private orderSnapshot(config: BotConfig): ShotSnapshot {
    const price = Number(config.order.price);
    const quantity = Number(config.order.quantity);
    const hasValue = Number.isFinite(price) && Number.isFinite(quantity) && price > 0 && quantity > 0;
    return {
      symbol: config.order.symbol || undefined,
      broker: config.account?.brokerName || config.order.brokerType,
      orderValueRials: hasValue ? Math.round(price * quantity) : undefined,
    };
  }

  private preparePayload(config: BotConfig): string {
    return fillOrderTemplate(config.network.bodyTemplate, {
      symbol: config.order.symbol,
      price: config.order.price,
      quantity: config.order.quantity,
    });
  }

  private prepareHeaders(config: BotConfig): Record<string, string> {
    const headers = { ...config.network.headers };
    if (config.network.cookies) headers.Cookie = config.network.cookies;
    return headers;
  }

  private calculateTargetDate(targetTimeStr: string): Date {
    const now = this.ports.clock.getExactNow();
    const [timePart, msPart = '0'] = targetTimeStr.split('.');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hours || 8, minutes || 45, seconds || 0, Number(msPart) || 0);
    return target;
  }

  private setState(newState: SniperState): void {
    this.state = newState;
    this.ports.broadcaster.broadcast({
      type: 'STATE_CHANGE',
      data: {
        state: this.state,
        timeSync: this.ports.clock.getStatus(),
      },
    });
  }

  private broadcastLog(level: 'info' | 'warn' | 'success' | 'error', text: string): void {
    this.ports.broadcaster.broadcast({
      type: 'SHOT_LOG',
      data: { level, text },
    });
  }

  private shotText(label: string, shot: OrderShotResult): string {
    const detail =
      shot.errorMessage || (shot.trackingCode ? `کد رهگیری: ${shot.trackingCode}` : 'پاسخ دریافت شد');
    return `[${label}] کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${detail}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
