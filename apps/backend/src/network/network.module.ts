import { Module } from '@nestjs/common';
import { BotConfigModule } from '../bot-config/bot-config.module.js';
import { ConnectionPoolController } from './connection-pool.controller.js';
import { ConnectionPoolService } from './connection-pool.service.js';

@Module({
  imports: [BotConfigModule],
  controllers: [ConnectionPoolController],
  providers: [ConnectionPoolService],
  exports: [ConnectionPoolService],
})
export class NetworkModule {}
