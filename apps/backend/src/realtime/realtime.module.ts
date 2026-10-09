import { Module } from '@nestjs/common';
import { SniperGateway } from './sniper.gateway.js';

@Module({
  providers: [SniperGateway],
  exports: [SniperGateway],
})
export class RealtimeModule {}
