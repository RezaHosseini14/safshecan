import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { redactBotConfig } from '../bot-config/redact.js';
import { BotConfigService } from '../bot-config/bot-config.service.js';
import { BROKER_PRESETS } from '../brokerage/broker-presets.js';
import { NestTimeSyncService } from '../clock/time-sync.service.js';
import { SniperService } from './sniper.service.js';

@ApiTags('Sniper Engine & System Status')
@Controller('api')
export class SniperController {
  constructor(
    private readonly sniperService: SniperService,
    private readonly configService: BotConfigService,
    private readonly timeSyncService: NestTimeSyncService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'بررسی سلامت سرویس (Health Check)' })
  @ApiResponse({ status: 200, description: 'سرویس آماده به کار است' })
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'دریافت وضعیت جاری ربات، موتور سرخطی، انحراف زمان و قالب‌ها' })
  @ApiResponse({ status: 200, description: 'وضعیت سیستم بدون راز کارگزاری' })
  getStatus() {
    return {
      config: redactBotConfig(this.configService.getConfig()),
      state: this.sniperService.getState(),
      timeSync: this.timeSyncService.getStatus(),
      results: this.sniperService.getResults(),
      presets: BROKER_PRESETS,
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'دریافت تاریخچه و شلیک‌های زنده موتور سرخطی' })
  @ApiResponse({ status: 200, description: 'نتایج شلیک‌ها و وضعیت' })
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
  @ApiOperation({ summary: 'مسلح‌سازی ربات برای شلیک در زمان هدف (Arm)' })
  @ApiResponse({ status: 200, description: 'نتیجه آماده‌باش ربات' })
  armSniper() {
    return this.sniperService.arm();
  }

  @Post('sniper/disarm')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'لغو آماده‌باش و خروج از حالت مسلح (Disarm)' })
  @ApiResponse({ status: 200, description: 'لغو موفقیت‌آمیز' })
  disarmSniper() {
    return this.sniperService.disarm();
  }

  @Post('sniper/test-shot')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({ summary: 'شلیک آزمایشی فوری جهت بررسی هدرها و پینگ بدون فعال‌سازی ساعت' })
  @ApiResponse({ status: 200, description: 'نتیجه شلیک تستی' })
  async testShot() {
    const result = await this.sniperService.testManualShoot();
    return {
      success: true,
      result,
    };
  }
}
