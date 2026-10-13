import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { SecurityModule } from './infrastructure/security/security.module.js';
import { QueueModule } from './infrastructure/queues/queue.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ObservabilityModule } from './infrastructure/observability/observability.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { PermissionsGuard } from './auth/permissions.guard.js';
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

import { CsrfGuard } from './auth/csrf.guard.js';

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    RedisModule,
    SecurityModule,
    QueueModule,
    AuthModule,
    ObservabilityModule,
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
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
