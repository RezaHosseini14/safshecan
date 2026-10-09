import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BotConfig } from '@saf-shekan/core';
import { findBrokerPreset } from '../brokerage/broker-presets.js';
import { DEFAULT_CONFIG } from './default-config.js';
import { restoreRedactedSecrets } from './redact.js';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE_PATH = path.resolve(configDir, '../../config.json');

@Injectable()
export class BotConfigService {
  private readonly logger = new Logger(BotConfigService.name);
  private config: BotConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): BotConfig {
    return structuredClone(this.config);
  }

  public loadConfig(): BotConfig {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<BotConfig>;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          order: { ...DEFAULT_CONFIG.order, ...(parsed.order ?? {}) },
          network: { ...DEFAULT_CONFIG.network, ...(parsed.network ?? {}) },
          timing: { ...DEFAULT_CONFIG.timing, ...(parsed.timing ?? {}) },
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`عدم موفقیت در خواندن config.json، استفاده از پیش‌فرض: ${message}`);
    }
    return structuredClone(DEFAULT_CONFIG);
  }

  public saveConfig(newConfig: Partial<BotConfig>): BotConfig {
    const safeIncoming = restoreRedactedSecrets(newConfig, this.config);
    this.config = {
      ...this.config,
      ...safeIncoming,
      order: { ...this.config.order, ...(safeIncoming.order ?? {}) },
      network: { ...this.config.network, ...(safeIncoming.network ?? {}) },
      timing: { ...this.config.timing, ...(safeIncoming.timing ?? {}) },
    };

    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
      this.logger.log('تنظیمات در config.json ذخیره شد.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`خطا در ذخیره‌سازی config.json: ${message}`);
    }

    return this.getConfig();
  }

  public applyPreset(presetId: string): BotConfig {
    const preset = findBrokerPreset(presetId);
    if (!preset) {
      throw new Error(`قالب کارگزاری با شناسه '${presetId}' یافت نشد.`);
    }

    this.config.order.brokerType = preset.id as BotConfig['order']['brokerType'];
    this.config.network.targetUrl = preset.sampleUrl;
    this.config.network.headers = { ...preset.defaultHeaders };
    this.config.network.bodyTemplate = preset.defaultBody;

    this.saveConfig(this.config);
    this.logger.log(`قالب کارگزاری «${preset.name}» اعمال شد → ${preset.sampleUrl}`);
    return this.getConfig();
  }
}
