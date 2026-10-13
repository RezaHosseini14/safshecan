import { describe, expect, it } from 'vitest';
import { CryptoKeysService } from '../src/auth/crypto-keys.service.js';
import type { JwtPayload } from '../src/auth/auth.types.js';

describe('Ed25519 Asymmetric Token Signing and Key Rotation', () => {
  const service = new CryptoKeysService();

  it('signs and verifies access token using Ed25519 with kid header', () => {
    const payload: JwtPayload = {
      sub: 'user-uuid-1234',
      username: 'trader-hft',
      roles: ['trader'],
      permissions: ['sniper:arm', 'sniper:fire_test'],
    };

    const token = service.signAccessToken(payload, 900);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    // Verify token
    const decoded = service.verifyAccessToken(token);
    expect(decoded.sub).toBe('user-uuid-1234');
    expect(decoded.username).toBe('trader-hft');
    expect(decoded.roles).toEqual(['trader']);
    expect(decoded.permissions).toEqual(['sniper:arm', 'sniper:fire_test']);
  });

  it('rejects tampered token', () => {
    const payload: JwtPayload = {
      sub: 'user-uuid-1234',
      username: 'trader-hft',
      roles: ['trader'],
      permissions: [],
    };

    const token = service.signAccessToken(payload, 900);
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, roles: ['admin'] })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    expect(() => service.verifyAccessToken(tamperedToken)).toThrow();
  });
});
