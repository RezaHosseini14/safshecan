import { Module } from '@nestjs/common';
import { BotConfigModule } from '../bot-config/bot-config.module.js';
import { BrokersController } from './brokers.controller.js';
import { BrokersService } from './brokers.service.js';

@Module({
  imports: [BotConfigModule],
  controllers: [BrokersController],
  providers: [BrokersService],
  exports: [BrokersService],
})
export class BrokerageModule {}
