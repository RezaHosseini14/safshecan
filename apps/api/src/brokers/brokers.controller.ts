import { Controller, Post, Get, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BrokersService } from './brokers.service.js';
import { ApplyPresetDto, ParseCurlDto } from './dtos/broker.dto.js';

@ApiTags('Brokers & cURL')
@Controller('api')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get('presets')
  @ApiOperation({ summary: 'فهرست قالب‌های پیش‌فرض کارگزاری‌ها' })
  getPresets() {
    return {
      success: true,
      presets: this.brokersService.getPresets(),
    };
  }

  @Post('presets/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'اعمال قالب کارگزاری پیش‌فرض' })
  @ApiResponse({ status: 200, description: 'قالب کارگزاری اعمال شد.' })
  applyPreset(@Body() body: ApplyPresetDto) {
    const config = this.brokersService.applyPreset(body.presetId);
    return {
      success: true,
      config,
    };
  }

  @Post('curl/parse')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'تحلیل هوشمند و استخراج پارامترها از دستور cURL' })
  @ApiResponse({ status: 200, description: 'مشخصات استخراج‌شده و تنظیمات به‌روزرسانی شده' })
  parseCurl(@Body() body: ParseCurlDto) {
    const rawCurl = body.curl || body.curlCommand;
    if (!rawCurl) {
      throw new BadRequestException('دستور cURL ارسال نشده است.');
    }

    const { parsed, config } = this.brokersService.parseCurl(rawCurl);

    return {
      success: true,
      parsed,
      network: parsed.network,
      brokerInfo: parsed.broker,
      accountInfo: parsed.account,
      extractedOrder: parsed.extractedOrder,
      config,
    };
  }
}
