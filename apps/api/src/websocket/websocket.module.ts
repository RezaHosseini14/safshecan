import { Module, Global } from '@nestjs/common';
import { SniperGateway } from './sniper.gateway.js';

@Global()
@Module({
  providers: [SniperGateway],
  exports: [SniperGateway],
})
export class AppWebSocketModule {}
