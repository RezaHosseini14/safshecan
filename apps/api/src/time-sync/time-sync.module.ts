import { Module, Global } from '@nestjs/common';
import { NestTimeSyncService } from './time-sync.service.js';
import { TimeSyncController } from './time-sync.controller.js';

@Global()
@Module({
  controllers: [TimeSyncController],
  providers: [NestTimeSyncService],
  exports: [NestTimeSyncService],
})
export class TimeSyncModule {}
