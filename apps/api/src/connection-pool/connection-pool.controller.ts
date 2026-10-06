import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionPoolService } from './connection-pool.service.js';
import { AppConfigService } from '../config/config.service.js';
import { PingDto, TestConnectionDto } from './dtos/connection.dto.js';

@ApiTags('Network & Broker')
@Controller('api')
export class ConnectionPoolController {
  constructor(
    private readonly connectionPoolService: ConnectionPoolService,
    private readonly configService: AppConfigService
  ) {}

  @Post('broker/test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تست اتصال زنده و پیش‌گرمایش SSL با سرور کارگزاری' })
  @ApiResponse({ status: 200, description: 'نتیجه تست و پینگ رفت و برگشت' })
  async testConnection(@Body() body: TestConnectionDto) {
    const cfg = this.configService.getConfig();
    const url = body.url || cfg.network.targetUrl;
    const headers = body.headers || cfg.network.headers;
    const rttMs = await this.connectionPoolService.preWarm(url, headers);

    return {
      success: rttMs >= 0,
      rttMs,
      url,
      message:
        rttMs >= 0
          ? `اتصال برقرار شد (${rttMs}ms)`
          : 'خطا در برقراری اتصال با سرور کارگزاری',
    };
  }

  @Post('network/ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'سنجش پینگ و تاخیر شبکه تا کارگزاری' })
  @ApiResponse({ status: 200, description: 'مقدار پینگ بر حسب میلی‌ثانیه' })
  async pingBroker(@Body() body: PingDto) {
    const cfg = this.configService.getConfig();
    const url = body.url || cfg.network.targetUrl;
    const pingMs = await this.connectionPoolService.pingBroker(url);

    return {
      success: true,
      pingMs,
    };
  }
}
