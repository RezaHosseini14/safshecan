import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
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
  @ApiOperation({ summary: t('swagger', 'saveConfig') })
  @ApiResponse({ status: 200, description: t('swagger', 'saveConfigOk') })
  saveConfig(@Body() body: SaveConfigDto) {
    this.configService.saveConfig(body as Partial<BotConfig>);
    return {
      success: true,
      message: t('errors', 'configSaved'),
      config: redactBotConfig(this.configService.getConfig()),
    };
  }
}
