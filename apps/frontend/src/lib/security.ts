import { z } from 'zod';

export const REDACTED_SECRET = '[redacted]';

const SECRET_KEY = /authorization|cookie|token|apikey|api-key|secret|password/i;

export const TimingConfigSchema = z.object({
  targetTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?$/),
  leadTimeMs: z.number().min(-5000).max(5000),
  burstCount: z.number().int().min(1).max(30),
  burstIntervalMs: z.number().min(0.5).max(1000),
});

export const OrderConfigSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
  brokerType: z.string().trim().min(1).max(32),
  side: z.enum(['BUY', 'SELL']),
});

export function maskSensitiveToken(token: string | undefined | null): string {
  if (!token) return '';
  const clean = token.trim();
  if (clean === REDACTED_SECRET) return REDACTED_SECRET;
  if (clean.length <= 10) return '********';
  return `${clean.slice(0, 4)}…${clean.slice(-2)}`;
}

export function sanitizeHeadersForDisplay(
  headers: Record<string, string> | undefined
): Record<string, string> {
  if (!headers) return {};
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    sanitized[key] = SECRET_KEY.test(key) ? maskSensitiveToken(value) : value;
  }
  return sanitized;
}

export function sanitizeText(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/[<>&"']/g, (char) => {
    if (char === '<') return '‹';
    if (char === '>') return '›';
    if (char === '&') return '＋';
    return '′';
  });
}

export function isValidBrokerUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export function isSecretRendered(text: string, secret: string): boolean {
  if (!secret || secret === REDACTED_SECRET || secret.length < 8) return false;
  return text.includes(secret);
}
