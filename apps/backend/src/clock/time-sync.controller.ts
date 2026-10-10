import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { Throttle } from '@nestjs/throttler';
import { NestTimeSyncService } from './time-sync.service.js';
import { TimeOffsetDto } from './dto/time-offset.dto.js';
import { TimeSyncScheduler } from './time-sync.scheduler.js';

@ApiTags('TimeSync')
@Controller('api/time')
export class TimeSyncController {
  constructor(
    private readonly timeSyncService: NestTimeSyncService,
    private readonly scheduler: TimeSyncScheduler
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: t('swagger', 'sync') })
  @ApiResponse({ status: 200, description: t('swagger', 'syncOk') })
  async syncTime() {
    this.timeSyncService.releaseManualHold();
    const status = await this.timeSyncService.sync();
    this.scheduler.broadcast(status);
    return {
      success: true,
      status,
    };
  }

  @Post('offset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: t('swagger', 'setOffset') })
  @ApiResponse({ status: 200, description: t('swagger', 'offsetOk') })
  setOffset(@Body() body: TimeOffsetDto) {
    const status = this.timeSyncService.setManualOffset(body.offsetMs);
    this.scheduler.broadcast(status);
    return {
      success: true,
      status,
    };
  }
}
