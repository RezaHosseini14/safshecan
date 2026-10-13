import { describe, it, expect } from 'vitest';
import { EnvelopeCipherService } from '../src/infrastructure/security/envelope-cipher.service.js';

describe('EnvelopeCipherService (AES-256-GCM)', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const cipher = new EnvelopeCipherService({ masterKeyHex: masterKey, defaultKeyVersion: 1 });

  it('should encrypt and decrypt secrets cleanly', () => {
    const secret = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_token_payload';
    const encrypted = cipher.encrypt(secret);

    expect(encrypted).toMatch(/^v1:1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+/);
    expect(encrypted).not.toContain(secret);

    const decrypted = cipher.decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('should fail with error if ciphertext is tampered with', () => {
    const encrypted = cipher.encrypt('super_secret_password');
    const tampered = encrypted.slice(0, -4) + 'abcd';

    expect(() => cipher.decrypt(tampered)).toThrow('Decryption failed: authentication tag mismatch or corrupted ciphertext');
  });

  it('should support key rotation', () => {
    const secret = 'my_broker_cookie_session=xyz123';
    const v1 = cipher.encrypt(secret, 1);
    expect(v1.startsWith('v1:1:')).toBe(true);

    const v2 = cipher.rotate(v1, 2);
    expect(v2.startsWith('v1:2:')).toBe(true);
    expect(cipher.decrypt(v2)).toBe(secret);
  });
});
