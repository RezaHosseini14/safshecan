import { Module } from '@nestjs/common';
import { BotConfigModule } from '../bot-config/bot-config.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NestTimeSyncService } from './time-sync.service.js';
import { TimeSyncController } from './time-sync.controller.js';

@Module({
  imports: [BotConfigModule, RealtimeModule],
  controllers: [TimeSyncController],
  providers: [NestTimeSyncService],
  exports: [NestTimeSyncService],
})
export class ClockModule {}
