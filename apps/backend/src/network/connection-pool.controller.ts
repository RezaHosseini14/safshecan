import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { ConnectionPoolService } from './connection-pool.service.js';
import { BotConfigService } from '../bot-config/bot-config.service.js';
import { PingDto, TestConnectionDto } from './dto/connection.dto.js';

@ApiTags('Network & Broker')
@Controller('api')
export class ConnectionPoolController {
  constructor(
    private readonly connectionPoolService: ConnectionPoolService,
    private readonly configService: BotConfigService
  ) {}

  @Post('broker/test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: t('swagger', 'connectionTest') })
  @ApiResponse({ status: 200, description: t('swagger', 'connectionTestOk') })
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
          ? t('errors', 'connected', { rtt: rttMs })
          : t('errors', 'connectFailed'),
    };
  }

  @Post('network/ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: t('swagger', 'ping') })
  @ApiResponse({ status: 200, description: t('swagger', 'pingOk') })
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
