import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { BotConfig } from '@saf-shekan/core';
import { BotConfigService } from './bot-config.service.js';
import { SaveConfigDto } from './dto/bot-config.dto.js';
import { redactBotConfig } from './redact.js';

@ApiTags('Config')
@Controller('api')
export class BotConfigController {
  constructor(private readonly configService: BotConfigService) {}

  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ذخیره تنظیمات ربات' })
  @ApiResponse({ status: 200, description: 'تنظیمات با موفقیت ذخیره شد.' })
  saveConfig(@Body() body: SaveConfigDto) {
    this.configService.saveConfig(body as Partial<BotConfig>);
    return {
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد.',
      config: redactBotConfig(this.configService.getConfig()),
    };
  }
}
