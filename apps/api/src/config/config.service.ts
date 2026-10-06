import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BotConfig } from '../types/index.js';
import { BROKER_PRESETS } from '../brokers/broker-presets.js';
import { DEFAULT_CONFIG } from './config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.resolve(__dirname, '../../config.json');

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private config: BotConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public loadConfig(): BotConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          order: { ...DEFAULT_CONFIG.order, ...(parsed.order || {}) },
          network: { ...DEFAULT_CONFIG.network, ...(parsed.network || {}) },
          timing: { ...DEFAULT_CONFIG.timing, ...(parsed.timing || {}) },
        };
      }
    } catch (err: any) {
      this.logger.warn(`عدم موفقیت در خواندن config.json، استفاده از پیش‌فرض: ${err.message}`);
    }
    return { ...DEFAULT_CONFIG };
  }

  public saveConfig(newConfig: Partial<BotConfig>): BotConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      order: { ...this.config.order, ...(newConfig.order || {}) },
      network: { ...this.config.network, ...(newConfig.network || {}) },
      timing: { ...this.config.timing, ...(newConfig.timing || {}) },
    };

    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
      this.logger.log('تنظیمات در config.json ذخیره شد.');
    } catch (err: any) {
      this.logger.error(`خطا در ذخیره‌سازی config.json: ${err.message}`);
    }

    return this.config;
  }

  public applyPreset(presetId: string): BotConfig {
    const preset = BROKER_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`قالب کارگزاری با شناسه '${presetId}' یافت نشد.`);
    }

    this.config.order.brokerType = preset.id as any;
    this.config.network.targetUrl = preset.sampleUrl;
    this.config.network.headers = { ...preset.defaultHeaders };
    this.config.network.bodyTemplate = preset.defaultBody;

    this.saveConfig(this.config);
    return this.config;
  }
}
