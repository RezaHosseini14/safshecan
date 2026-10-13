import { Controller, Get, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../auth/decorators.js';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';
import { MetricsService } from './metrics.service.js';

@ApiTags('System & Observability')
@Controller('api')
export class HealthController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness health check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for PostgreSQL and Redis connectivity' })
  @ApiResponse({ status: 200, description: 'All backing services connected' })
  @ApiResponse({ status: 503, description: 'One or more backing services unavailable' })
  async getReady(@Res() res: Response) {
    const [dbHealth, redisHealth] = await Promise.all([
      this.dbService.isHealthy(),
      this.redisService.isHealthy(),
    ]);

    const isReady = dbHealth.ok && redisHealth.ok;
    const statusCode = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json({
      status: isReady ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.ok ? 'up' : 'down',
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
        redis: {
          status: redisHealth.ok ? 'up' : 'down',
          latencyMs: redisHealth.latencyMs,
          error: redisHealth.error,
        },
      },
    });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint (Restricted to internal network or metrics token)' })
  async getMetrics(@Req() req: Request, @Res() res: Response) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const authHeader = req.headers.authorization;
    const configuredToken = process.env.METRICS_TOKEN;

    const isLoopbackOrPrivate =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.');

    const tokenValid =
      configuredToken && authHeader === `Bearer ${configuredToken}`;

    const isAdmin = (req as unknown as { user?: { roles?: string[] } }).user?.roles?.includes('admin');

    if (!isLoopbackOrPrivate && !tokenValid && !isAdmin) {
      return res.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Metrics endpoint is restricted to internal network or authorized scraper.',
      });
    }

    const metrics = await this.metricsService.getPrometheusMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    return res.send(metrics);
  }
}
