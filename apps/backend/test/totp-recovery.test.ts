import { describe, expect, it } from 'vitest';
import { TotpService } from '../src/auth/totp.service.js';
import { generateSync } from 'otplib';

describe('TOTP and Recovery Codes Service', () => {
  const totpService = new TotpService();

  it('generates secret, valid OTP token verifies successfully', () => {
    const { secret, otpauthUrl } = totpService.generateSecret('trader-01');
    expect(secret).toBeDefined();
    expect(otpauthUrl).toContain('SafShekan:trader-01');

    const token = generateSync({ secret });
    expect(totpService.verifyTotpToken(secret, token)).toBe(true);
    expect(totpService.verifyTotpToken(secret, '000000')).toBe(false);
  });

  it('generates 10 single-use recovery codes and consumes one safely', () => {
    const { plainCodes, hashedCodes } = totpService.generateRecoveryCodes();
    expect(plainCodes).toHaveLength(10);
    expect(hashedCodes).toHaveLength(10);

    const firstCode = plainCodes[0];
    const verification = totpService.verifyAndConsumeRecoveryCode(firstCode, hashedCodes);

    expect(verification.valid).toBe(true);
    expect(verification.remainingHashedCodes).toHaveLength(9);

    // Using the same recovery code a second time must fail (single-use)
    const secondAttempt = totpService.verifyAndConsumeRecoveryCode(
      firstCode,
      verification.remainingHashedCodes
    );
    expect(secondAttempt.valid).toBe(false);
  });
});
