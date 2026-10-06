import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module.js';
import { TimeSyncModule } from './time-sync/time-sync.module.js';
import { ConnectionPoolModule } from './connection-pool/connection-pool.module.js';
import { AppWebSocketModule } from './websocket/websocket.module.js';
import { SniperModule } from './sniper/sniper.module.js';
import { BrokersModule } from './brokers/brokers.module.js';
import { SymbolsModule } from './symbols/symbols.module.js';
import { SimulationModule } from './simulation/simulation.module.js';
import { FrontendModule } from './frontend/frontend.module.js';

import { AppThrottlerGuard } from './common/guards/throttler.guard.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120, // 120 requests per minute by default
      },
    ]),
    AppConfigModule,
    TimeSyncModule,
    ConnectionPoolModule,
    AppWebSocketModule,
    SniperModule,
    BrokersModule,
    SymbolsModule,
    SimulationModule,
    FrontendModule,
  ],
  providers: [],
})
export class AppModule {}
