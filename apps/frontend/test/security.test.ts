import { describe, expect, it } from 'vitest';
import {
  OrderConfigSchema,
  TimingConfigSchema,
  isSecretRendered,
  isValidBrokerUrl,
  maskSensitiveToken,
  sanitizeHeadersForDisplay,
  sanitizeText,
} from '../src/lib/security';

describe('frontend secret masking', () => {
  it('hides an authorization value before display', () => {
    const secret = 'Bearer super-secret-token-value';
    const shown = sanitizeHeadersForDisplay({ Authorization: secret, Accept: 'application/json' });
    expect(shown.Accept).toBe('application/json');
    expect(isSecretRendered(shown.Authorization, secret)).toBe(false);
    expect(shown.Authorization).not.toBe(secret);
  });

  it('keeps the redacted placeholder instead of inventing a token', () => {
    expect(maskSensitiveToken('[redacted]')).toBe('[redacted]');
  });

  it('rejects hostile order and timing input', () => {
    expect(OrderConfigSchema.safeParse({ symbol: '', price: -1, quantity: 0, brokerType: 'custom', side: 'BUY' }).success).toBe(false);
    expect(TimingConfigSchema.safeParse({ targetTime: '99:99:99', leadTimeMs: 90000, burstCount: 0, burstIntervalMs: 0 }).success).toBe(false);
  });

  it('allows only https broker targets', () => {
    expect(isValidBrokerUrl('https://broker.example/order')).toBe(true);
    expect(isValidBrokerUrl('http://broker.example/order')).toBe(false);
    expect(isValidBrokerUrl('javascript:alert(1)')).toBe(false);
  });

  it('strips markup from broker text', () => {
    expect(sanitizeText('<script>alert(1)</script>')).not.toContain('<');
  });
});
