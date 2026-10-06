import { describe, it, expect } from 'vitest';
import {
  TimingConfigSchema,
  OrderConfigSchema,
  maskSensitiveToken,
  sanitizeHeadersForDisplay,
  sanitizeText,
  isValidBrokerUrl,
  validateCurlString,
  formatNumberEn,
  formatNumberPersian,
} from '../src/lib/security';

describe('Security & Validation Tests', () => {
  describe('TimingConfigSchema', () => {
    it('should validate valid timing configs', () => {
      const valid = {
        targetTime: '08:45:00.000',
        leadTimeMs: 18,
        burstCount: 5,
        burstIntervalMs: 2.5,
        preWarmTimeMs: 1500,
        ntpSyncIntervalMs: 60000,
      };
      const result = TimingConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid targetTime patterns', () => {
      const invalid = {
        targetTime: '25:99:99',
        leadTimeMs: 18,
        burstCount: 5,
        burstIntervalMs: 2.5,
        preWarmTimeMs: 1500,
        ntpSyncIntervalMs: 60000,
      };
      const result = TimingConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject burst count exceeding maximum bounds', () => {
      const invalid = {
        targetTime: '08:45:00.000',
        leadTimeMs: 18,
        burstCount: 999, // max is 30
        burstIntervalMs: 2.5,
        preWarmTimeMs: 1500,
        ntpSyncIntervalMs: 60000,
      };
      const result = TimingConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderConfigSchema', () => {
    it('should validate valid order configuration', () => {
      const valid = {
        symbol: 'فزر',
        price: 25000,
        quantity: 500,
        brokerType: 'tadbir',
        side: 'BUY',
        antiDoubleSpend: true,
      };
      const result = OrderConfigSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative or zero price', () => {
      const invalid = {
        symbol: 'فزر',
        price: -100,
        quantity: 500,
        brokerType: 'tadbir',
        side: 'BUY',
      };
      const result = OrderConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject empty symbol', () => {
      const invalid = {
        symbol: '   ',
        price: 25000,
        quantity: 500,
        brokerType: 'tadbir',
        side: 'BUY',
      };
      const result = OrderConfigSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Token Masking & Privacy Protection', () => {
    it('should mask long bearer tokens properly', () => {
      const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz123456';
      const masked = maskSensitiveToken(token);
      expect(masked).toContain('****');
      expect(masked.startsWith('Bearer')).toBe(true);
      expect(masked.endsWith('3456')).toBe(true);
      expect(masked).not.toBe(token);
    });

    it('should fully mask short tokens', () => {
      const token = 'secret1';
      expect(maskSensitiveToken(token)).toBe('********');
    });

    it('should sanitize sensitive HTTP headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        Cookie: 'session_id=abcdef1234567890',
        'X-Public-Data': 'allow',
      };

      const sanitized = sanitizeHeadersForDisplay(headers);
      expect(sanitized['Content-Type']).toBe('application/json');
      expect(sanitized['X-Public-Data']).toBe('allow');
      expect(sanitized.Authorization).toContain('****');
      expect(sanitized.Cookie).toContain('****');
    });
  });

  describe('XSS Sanitization & URL Validation', () => {
    it('should sanitize HTML injection tags', () => {
      const attack = '<script>alert("xss")</script>';
      const cleaned = sanitizeText(attack);
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).toContain('&lt;script&gt;');
    });

    it('should validate legitimate broker URLs', () => {
      expect(isValidBrokerUrl('https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder')).toBe(true);
      expect(isValidBrokerUrl('http://127.0.0.1:3880/api/status')).toBe(true);
    });

    it('should reject malicious non-HTTP URLs', () => {
      expect(isValidBrokerUrl('javascript:alert(1)')).toBe(false);
      expect(isValidBrokerUrl('file:///etc/passwd')).toBe(false);
      expect(isValidBrokerUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('cURL Validator', () => {
    it('should accept valid curl commands', () => {
      const validCurl = "curl 'https://example.com' -H 'Auth: test'";
      expect(validateCurlString(validCurl).isValid).toBe(true);
    });

    it('should reject non-curl strings', () => {
      const invalid = 'wget https://example.com';
      expect(validateCurlString(invalid).isValid).toBe(false);
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers with comma separation', () => {
      expect(formatNumberEn(12500000)).toBe('12,500,000');
      expect(formatNumberPersian(1000)).toBe('۱٬۰۰۰');
    });
  });
});
