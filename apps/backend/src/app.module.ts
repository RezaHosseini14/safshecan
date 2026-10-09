import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { BotConfigModule } from './bot-config/bot-config.module.js';
import { BrokerageModule } from './brokerage/brokerage.module.js';
import { ClockModule } from './clock/clock.module.js';
import { EngineModule } from './engine/sniper.module.js';
import { MarketModule } from './market/market.module.js';
import { NetworkModule } from './network/network.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { EnvModule } from './shared/config/env.module.js';
import { AllExceptionsFilter } from './shared/http/filters/http-exception.filter.js';
import { AppThrottlerGuard } from './shared/http/guards/throttler.guard.js';
import { LoggingInterceptor } from './shared/http/interceptors/logging.interceptor.js';

@Module({
  imports: [
    EnvModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),
    BotConfigModule,
    ClockModule,
    NetworkModule,
    RealtimeModule,
    EngineModule,
    BrokerageModule,
    MarketModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
