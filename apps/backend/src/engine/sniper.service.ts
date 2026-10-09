import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BotConfigService } from '../bot-config/bot-config.service.js';
import { NestTimeSyncService } from '../clock/time-sync.service.js';
import { SniperGateway } from '../realtime/sniper.gateway.js';
import { formatExactTime } from '../shared/time/format-time.js';
import { SniperEngine } from './domain/sniper-engine.js';
import { UndiciOrderTransport } from './undici-order-transport.js';

@Injectable()
export class SniperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SniperService.name);
  private readonly engine: SniperEngine;
  private clockInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: BotConfigService,
    private readonly timeSync: NestTimeSyncService,
    transport: UndiciOrderTransport,
    private readonly gateway: SniperGateway
  ) {
    this.engine = new SniperEngine({
      clock: timeSync,
      transport,
      broadcaster: {
        broadcast: (message) => gateway.broadcast(message),
        connectedClients: () => gateway.getConnectedClientsCount(),
      },
      readConfig: () => configService.getConfig(),
    });
  }

  onModuleInit() {
    this.gateway.setConnectionListener((client) => {
      this.gateway.send(client, {
        type: 'STATE_CHANGE',
        data: { state: this.engine.getState() },
      });
      this.gateway.send(client, {
        type: 'TIME_SYNC',
        data: this.timeSync.getStatus(),
      });
    });
    this.clockInterval = setInterval(() => {
      if (this.gateway.getConnectedClientsCount() === 0) return;
      const exactNow = this.timeSync.getExactNow();
      this.gateway.broadcast({
        type: 'CLOCK_TICK',
        data: {
          currentExactTime: formatExactTime(exactNow, true),
          timestampMs: exactNow.getTime(),
          state: this.engine.getState(),
          targetTime: this.configService.getConfig().timing.targetTime,
        },
      });
    }, 100);
    this.logger.log('✓ موتور سرخطی دقیق و تپش ساعت اتمی (Atomic Clock Ticker) فعال شد.');
  }

  onModuleDestroy() {
    this.gateway.setConnectionListener(null);
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    this.engine.stopClock();
  }

  public getState() {
    return this.engine.getState();
  }

  public getResults() {
    return this.engine.getResults();
  }

  public arm() {
    const result = this.engine.arm();
    this.logger.log(result.message);
    return result;
  }

  public disarm() {
    const result = this.engine.disarm();
    this.logger.log(result.message);
    return result;
  }

  public testManualShoot() {
    const config = this.configService.getConfig();
    this.logger.log(`ارسال شلیک آزمایشی به ${config.network.targetUrl}...`);
    return this.engine.testManualShoot();
  }
}
