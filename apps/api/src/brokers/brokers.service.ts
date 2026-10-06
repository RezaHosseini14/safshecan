import { Injectable, BadRequestException } from '@nestjs/common';
import { BROKER_PRESETS, BrokerPreset } from './broker-presets.js';
import { CurlParser, AdvancedCurlParseResult } from './curl-parser.js';
import { AppConfigService } from '../config/config.service.js';
import { BotConfig } from '../types/index.js';

@Injectable()
export class BrokersService {
  constructor(private readonly configService: AppConfigService) {}

  public getPresets(): BrokerPreset[] {
    return BROKER_PRESETS;
  }

  public applyPreset(presetId: string): BotConfig {
    return this.configService.applyPreset(presetId);
  }

  public parseCurl(rawCurl: string): {
    parsed: AdvancedCurlParseResult;
    config: BotConfig;
  } {
    if (!rawCurl || typeof rawCurl !== 'string') {
      throw new BadRequestException('دستور cURL ارسال نشده است.');
    }

    const parsed = CurlParser.parseAdvanced(rawCurl);
    const currentConfig = this.configService.getConfig();

    currentConfig.network = {
      ...currentConfig.network,
      ...parsed.network,
    };
    currentConfig.order.brokerType = parsed.broker.id as any;

    if (parsed.extractedOrder.symbol) {
      currentConfig.order.symbol = parsed.extractedOrder.symbol;
    }
    if (parsed.extractedOrder.price) {
      currentConfig.order.price = parsed.extractedOrder.price;
    }
    if (parsed.extractedOrder.quantity) {
      currentConfig.order.quantity = parsed.extractedOrder.quantity;
    }
    if (parsed.extractedOrder.isin) {
      currentConfig.order.isin = parsed.extractedOrder.isin;
    }
    if (parsed.account) {
      currentConfig.account = parsed.account;
    }

    const savedConfig = this.configService.saveConfig(currentConfig);

    return {
      parsed,
      config: savedConfig,
    };
  }
}
