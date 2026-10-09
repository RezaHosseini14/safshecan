import { Module } from '@nestjs/common';
import { BotConfigModule } from '../bot-config/bot-config.module.js';
import { ClockModule } from '../clock/clock.module.js';
import { NetworkModule } from '../network/network.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { SniperController } from './sniper.controller.js';
import { SniperService } from './sniper.service.js';
import { UndiciOrderTransport } from './undici-order-transport.js';

@Module({
  imports: [BotConfigModule, ClockModule, NetworkModule, RealtimeModule],
  controllers: [SniperController],
  providers: [UndiciOrderTransport, SniperService],
  exports: [SniperService],
})
export class EngineModule {}
