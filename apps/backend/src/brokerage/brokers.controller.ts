import { Controller, Post, Get, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { Throttle } from '@nestjs/throttler';
import { redactBotConfig } from '../bot-config/redact.js';
import { BrokersService } from './brokers.service.js';
import { ApplyPresetDto, ParseCurlDto } from './dto/broker.dto.js';

@ApiTags('Brokers & cURL')
@Controller('api')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get('presets')
  @ApiOperation({ summary: t('swagger', 'presetList') })
  getPresets() {
    return {
      success: true,
      presets: this.brokersService.getPresets(),
    };
  }

  @Post('presets/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: t('swagger', 'presetApply') })
  @ApiResponse({ status: 200, description: t('swagger', 'presetApplied') })
  applyPreset(@Body() body: ApplyPresetDto) {
    const config = this.brokersService.applyPreset(body.presetId);
    return {
      success: true,
      config: redactBotConfig(config),
    };
  }

  @Post('curl/parse')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: t('swagger', 'curlParse') })
  @ApiResponse({ status: 200, description: t('swagger', 'curlParsed') })
  parseCurl(@Body() body: ParseCurlDto) {
    const rawCurl = body.curl || body.curlCommand;
    if (!rawCurl) {
      throw new BadRequestException(t('errors', 'curlMissing'));
    }

    const { parsed, config } = this.brokersService.parseCurl(rawCurl);
    const safeConfig = redactBotConfig(config);
    const safeNetwork = {
      ...parsed.network,
      headers: safeConfig.network.headers,
      cookies: safeConfig.network.cookies,
    };

    return {
      success: true,
      parsed: { ...parsed, network: safeNetwork },
      network: safeNetwork,
      brokerInfo: parsed.broker,
      accountInfo: parsed.account,
      extractedOrder: parsed.extractedOrder,
      config: safeConfig,
    };
  }
}
