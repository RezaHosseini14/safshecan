import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppConfigService } from './config.service.js';
import { SaveConfigDto } from './dtos/bot-config.dto.js';
import { BotConfig } from '../types/index.js';

@ApiTags('Config')
@Controller('api')
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ذخیره تنظیمات ربات' })
  @ApiResponse({ status: 200, description: 'تنظیمات با موفقیت ذخیره شد.' })
  saveConfig(@Body() body: SaveConfigDto) {
    this.configService.saveConfig(body as unknown as Partial<BotConfig>);
    return {
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد.',
      config: this.configService.getConfig(),
    };
  }
}
