import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private shotCount = 0;
  private totalShotLatencyMs = 0;

  constructor(
    private readonly dbService: DatabaseService,
    private readonly redisService: RedisService
  ) {}

  public recordHttpRequest(): void {
    this.requestCount++;
  }

  public recordOrderShot(latencyMs: number): void {
    this.shotCount++;
    this.totalShotLatencyMs += latencyMs;
  }

  public async getPrometheusMetrics(): Promise<string> {
    const db = await this.dbService.isHealthy();
    const redis = await this.redisService.isHealthy();

    const avgShotLatency = this.shotCount > 0 ? (this.totalShotLatencyMs / this.shotCount).toFixed(2) : '0';

    return [
      '# HELP process_uptime_seconds Total process uptime in seconds',
      '# TYPE process_uptime_seconds counter',
      `process_uptime_seconds ${Math.floor(process.uptime())}`,
      '',
      '# HELP safshekan_http_requests_total Total HTTP requests handled',
      '# TYPE safshekan_http_requests_total counter',
      `safshekan_http_requests_total ${this.requestCount}`,
      '',
      '# HELP safshekan_order_shots_total Total high-speed order shots fired',
      '# TYPE safshekan_order_shots_total counter',
      `safshekan_order_shots_total ${this.shotCount}`,
      '',
      '# HELP safshekan_order_shot_avg_latency_ms Average order shot network latency in milliseconds',
      '# TYPE safshekan_order_shot_avg_latency_ms gauge',
      `safshekan_order_shot_avg_latency_ms ${avgShotLatency}`,
      '',
      '# HELP safshekan_database_up PostgreSQL database connectivity status',
      '# TYPE safshekan_database_up gauge',
      `safshekan_database_up ${db.ok ? 1 : 0}`,
      `safshekan_database_latency_ms ${db.latencyMs}`,
      '',
      '# HELP safshekan_redis_up Redis cache and coordination connectivity status',
      '# TYPE safshekan_redis_up gauge',
      `safshekan_redis_up ${redis.ok ? 1 : 0}`,
      `safshekan_redis_latency_ms ${redis.latencyMs}`,
    ].join('\n');
  }
}
