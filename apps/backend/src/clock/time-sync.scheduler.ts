import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { TimeSyncStatus } from '@saf-shekan/core';
import { BotConfigService } from '../bot-config/bot-config.service.js';
import { SniperGateway } from '../realtime/sniper.gateway.js';
import { NestTimeSyncService } from './time-sync.service.js';
import { shouldRunScheduledSync } from './time-sync-policy.js';

const DEFAULT_INTERVAL_MS = 15000;
const MIN_INTERVAL_MS = 5000;

@Injectable()
export class TimeSyncScheduler implements OnModuleDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private inFlight = false;

  constructor(
    private readonly timeSync: NestTimeSyncService,
    private readonly configService: BotConfigService,
    private readonly gateway: SniperGateway
  ) {}

  start(): void {
    if (process.env.NODE_ENV === 'test' || this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  broadcast(status: TimeSyncStatus): void {
    this.gateway.broadcast({
      type: 'TIME_SYNC',
      data: status,
    });
  }

  onModuleDestroy(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      void this.tick().finally(() => {
        this.timer = null;
        this.scheduleNext();
      });
    }, this.intervalMs());
  }

  private async tick(): Promise<void> {
    const current = this.timeSync.getStatus();
    if (!shouldRunScheduledSync({ inFlight: this.inFlight, source: current.source })) return;
    this.inFlight = true;
    try {
      const status = await this.timeSync.sync();
      this.broadcast(status);
    } finally {
      this.inFlight = false;
    }
  }

  private intervalMs(): number {
    const configured = this.configService.getConfig().timing.ntpSyncIntervalMs;
    if (typeof configured === 'number' && Number.isFinite(configured) && configured >= MIN_INTERVAL_MS) {
      return configured;
    }
    return DEFAULT_INTERVAL_MS;
  }
}
