import { Module } from '@nestjs/common';
import { SniperService } from './sniper.service.js';
import { SniperController } from './sniper.controller.js';

@Module({
  controllers: [SniperController],
  providers: [SniperService],
  exports: [SniperService],
})
export class SniperModule {}
