import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BotConfig } from '../types/index.js';
import { BROKER_PRESETS } from '../brokers/broker-presets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.resolve(__dirname, '../../config.json');

export const DEFAULT_CONFIG: BotConfig = {
  order: {
    symbol: 'عرضه_اولیه',
    price: 10000,
    quantity: 100,
    side: 'BUY',
    brokerType: 'custom',
  },
  network: {
    targetUrl: 'https://onlineplus.examplebroker.ir/api/Order/SendOrder',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    bodyTemplate: JSON.stringify(
      {
        symbol: '{{symbol}}',
        price: '{{price}}',
        quantity: '{{quantity}}',
        side: 1,
      },
      null,
      2
    ),
    cookies: '',
  },
  timing: {
    targetTime: '08:45:00.000',
    leadTimeMs: 15, // ۱۵ میلی‌ثانیه جبران پینگ برای رسیدن بسته در اولین میلی‌ثانیه ساعت ۰۸:۴۵
    burstCount: 8,  // ۸ شلیک رگباری
    burstIntervalMs: 40, // هر ۴۰ میلی‌ثانیه یک شلیک
    preWarmSeconds: 12,  // ۱۲ ثانیه قبل از ساعت هدف کانکشن SSL گرم شود
    stopOnFirstSuccess: true,
  },
  serverPort: 3880,
  autoOpenBrowser: true,
  soundAlertEnabled: true,
  ntpServers: [
    'ir.pool.ntp.org',
    'time.google.com',
    'pool.ntp.org',
  ],
};

export class ConfigManager {
  private config: BotConfig;

  constructor() {
    this.config = this.load();
  }

  public getConfig(): BotConfig {
    return this.config;
  }

  public load(): BotConfig {
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
    } catch (err) {
      console.warn('عدم موفقیت در خواندن config.json، استفاده از تنظیمات پیش‌فرض.');
    }
    return { ...DEFAULT_CONFIG };
  }

  public save(newConfig: BotConfig): void {
    this.config = newConfig;
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (err) {
      console.error('خطا در ذخیره فایل config.json:', err);
    }
  }

  public applyPreset(presetId: string): void {
    const preset = BROKER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      this.config.order.brokerType = preset.id as any;
      this.config.network.targetUrl = preset.sampleUrl;
      this.config.network.headers = { ...preset.defaultHeaders };
      this.config.network.bodyTemplate = preset.defaultBody;
      this.save(this.config);
    }
  }
}
