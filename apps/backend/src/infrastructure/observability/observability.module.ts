import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { HealthController } from './health.controller.js';

@Global()
@Module({
  controllers: [HealthController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
