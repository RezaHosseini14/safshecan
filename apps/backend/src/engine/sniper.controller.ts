import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { redactBotConfig } from '../bot-config/redact.js';
import { BotConfigService } from '../bot-config/bot-config.service.js';
import { BROKER_PRESETS } from '../brokerage/broker-presets.js';
import { NestTimeSyncService } from '../clock/time-sync.service.js';
import { SniperService } from './sniper.service.js';
import { Public, RequirePermissions } from '../auth/decorators.js';

@ApiTags('Sniper Engine & System Status')
@Controller('api')
export class SniperController {
  constructor(
    private readonly sniperService: SniperService,
    private readonly configService: BotConfigService,
    private readonly timeSyncService: NestTimeSyncService
  ) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: t('swagger', 'status') })
  @ApiResponse({ status: 200, description: t('swagger', 'statusOk') })
  getStatus() {
    return {
      config: redactBotConfig(this.configService.getConfig()),
      state: this.sniperService.getState(),
      timeSync: this.timeSyncService.getStatus(),
      results: this.sniperService.getResults(),
      presets: BROKER_PRESETS,
    };
  }

  @Public()
  @Get('reports')
  @ApiOperation({ summary: t('swagger', 'history') })
  @ApiResponse({ status: 200, description: t('swagger', 'historyOk') })
  getReports() {
    return {
      success: true,
      results: this.sniperService.getResults(),
      state: this.sniperService.getState(),
      timeSync: this.timeSyncService.getStatus(),
    };
  }

  @Post('sniper/arm')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('sniper:arm')
  @ApiOperation({ summary: t('swagger', 'arm') })
  @ApiResponse({ status: 200, description: t('swagger', 'armOk') })
  armSniper() {
    return this.sniperService.arm();
  }

  @Post('sniper/disarm')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @RequirePermissions('sniper:disarm')
  @ApiOperation({ summary: t('swagger', 'disarm') })
  @ApiResponse({ status: 200, description: t('swagger', 'disarmOk') })
  disarmSniper() {
    return this.sniperService.disarm();
  }

  @Post('sniper/test-shot')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @RequirePermissions('sniper:fire_test')
  @ApiOperation({ summary: t('swagger', 'testShot') })
  @ApiResponse({ status: 200, description: t('swagger', 'testShotOk') })
  async testShot() {
    const result = await this.sniperService.testManualShoot();
    return {
      success: true,
      result,
    };
  }
}
