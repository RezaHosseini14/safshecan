import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NestTimeSyncService } from './time-sync.service.js';
import { TimeOffsetDto } from './dto/time-offset.dto.js';
import { SniperGateway } from '../realtime/sniper.gateway.js';

@ApiTags('TimeSync')
@Controller('api/time')
export class TimeSyncController {
  constructor(
    private readonly timeSyncService: NestTimeSyncService,
    private readonly gateway: SniperGateway
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'همگام‌سازی زمان با سرورهای NTP و HTTP' })
  @ApiResponse({ status: 200, description: 'زمان با موفقیت کالیبره شد.' })
  async syncTime() {
    const status = await this.timeSyncService.sync();
    this.gateway.broadcast({
      type: 'TIME_SYNC',
      data: status,
    });
    return {
      success: true,
      status,
    };
  }

  @Post('offset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تنظیم دستی اختلاف زمان (میلی‌ثانیه)' })
  @ApiResponse({ status: 200, description: 'انحراف زمان به صورت دستی اعمال شد.' })
  setOffset(@Body() body: TimeOffsetDto) {
    const status = this.timeSyncService.setManualOffset(body.offsetMs);
    this.gateway.broadcast({
      type: 'TIME_SYNC',
      data: status,
    });
    return {
      success: true,
      status,
    };
  }
}
