import { Module } from '@nestjs/common';
import { BrokersService } from './brokers.service.js';
import { BrokersController } from './brokers.controller.js';

@Module({
  controllers: [BrokersController],
  providers: [BrokersService],
  exports: [BrokersService],
})
export class BrokersModule {}
