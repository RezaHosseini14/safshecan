import { z } from 'zod';

/**
 * Enterprise security utilities for SafShekan trading terminal.
 * Provides credential masking, input sanitization, URL validation, and Zod schemas.
 */

// Zod schema for timing configuration
export const TimingConfigSchema = z.object({
  targetTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?$/, {
    message: 'فرمت زمان نامعتبر است (الگوی مجاز: HH:mm:ss یا HH:mm:ss.SSS)',
  }),
  leadTimeMs: z.number().min(-5000).max(5000, {
    message: 'لیدتایم باید عددی بین -5000 تا +5000 میلی‌ثانیه باشد',
  }),
  burstCount: z.number().int().min(1).max(30, {
    message: 'تعداد شلیک‌های رگباری باید بین ۱ تا ۳۰ باشد',
  }),
  burstIntervalMs: z.number().min(0.5).max(1000, {
    message: 'فاصله شلیک‌ها باید بین ۰.۵ تا ۱۰۰۰ میلی‌ثانیه باشد',
  }),
  preWarmTimeMs: z.number().min(100).max(60000, {
    message: 'زمان پیش‌گرمایش سوکت باید بین ۱۰۰ تا ۶۰۰۰۰ میلی‌ثانیه باشد',
  }),
  ntpSyncIntervalMs: z.number().min(5000).max(3600000),
});

// Zod schema for order configuration
export const OrderConfigSchema = z.object({
  symbol: z.string().trim().min(1, { message: 'نماد الزامی است' }).max(20),
  price: z.number().positive({ message: 'قیمت باید عددی مثبت و بزرگ‌تر از صفر باشد' }),
  quantity: z.number().int().positive({ message: 'حجم سفارش باید عدد صحیح مثبت باشد' }),
  brokerType: z.enum(['tadbir', 'mofid', 'agah', 'farabixo', 'sahra', 'custom']),
  isin: z.string().optional(),
  side: z.enum(['BUY', 'SELL']),
  antiDoubleSpend: z.boolean().default(true),
});

// Mask sensitive authorization tokens, passwords, cookies
export function maskSensitiveToken(token: string | undefined | null): string {
  if (!token) return '';
  const clean = token.trim();
  if (clean.length <= 10) return '********';
  const prefix = clean.substring(0, 6);
  const suffix = clean.substring(clean.length - 4);
  return `${prefix}...****...${suffix}`;
}

// Mask sensitive cURL headers before display or logging
export function sanitizeHeadersForDisplay(headers: Record<string, string>): Record<string, string> {
  const sensitiveKeys = ['authorization', 'token', 'cookie', 'set-cookie', 'x-auth-token', 'apikey', 'secret'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = maskSensitiveToken(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Sanitize string to prevent basic XSS or script injection
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate target broker URL safely
export function isValidBrokerUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// Format numbers with Persian/locale separators
export function formatNumberPersian(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return '۰';
  return Number(num).toLocaleString('fa-IR');
}

// Format English numbers with commas
export function formatNumberEn(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  return Number(num).toLocaleString('en-US');
}

// Validate cURL command string
export function validateCurlString(curl: string): { isValid: boolean; error?: string } {
  const trimmed = curl.trim();
  if (!trimmed) {
    return { isValid: false, error: 'دستور cURL نمی‌تواند خالی باشد.' };
  }
  if (!trimmed.toLowerCase().startsWith('curl')) {
    return { isValid: false, error: 'دستور باید با عبارت curl شروع شود.' };
  }
  return { isValid: true };
}
