import { Module } from '@nestjs/common';
import { BotConfigController } from './bot-config.controller.js';
import { BotConfigService } from './bot-config.service.js';

@Module({
  controllers: [BotConfigController],
  providers: [BotConfigService],
  exports: [BotConfigService],
})
export class BotConfigModule {}
