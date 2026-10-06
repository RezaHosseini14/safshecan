import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SniperService } from './sniper.service.js';
import { AppConfigService } from '../config/config.service.js';
import { NestTimeSyncService } from '../time-sync/time-sync.service.js';
import { BROKER_PRESETS } from '../brokers/broker-presets.js';

@ApiTags('Sniper Engine & System Status')
@Controller('api')
export class SniperController {
  constructor(
    private readonly sniperService: SniperService,
    private readonly configService: AppConfigService,
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
  @ApiResponse({ status: 200, description: 'وضعیت کامل سیستم' })
  getStatus() {
    return {
      config: this.configService.getConfig(),
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
