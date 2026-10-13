import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';

@Injectable()
export class TotpService {
  public generateSecret(username: string): { secret: string; otpauthUrl: string } {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      label: username,
      issuer: 'SafShekan',
    });
    return { secret, otpauthUrl };
  }

  public verifyTotpToken(secret: string, token: string): boolean {
    try {
      const res = verifySync({
        secret,
        token: token.trim(),
        epochTolerance: 30, // 30s clock drift tolerance
      });
      return res.valid;
    } catch {
      return false;
    }
  }

  /**
   * Generates 10 single-use recovery codes, returning both the plain codes to display to the user once,
   * and SHA-256 hashes to store in the database.
   */
  public generateRecoveryCodes(): { plainCodes: string[]; hashedCodes: string[] } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars e.g. "A1B2C3D4E5"
      const formatted = `${code.slice(0, 5)}-${code.slice(5)}`;
      plainCodes.push(formatted);
      hashedCodes.push(this.hashCode(formatted));
    }

    return { plainCodes, hashedCodes };
  }

  public verifyAndConsumeRecoveryCode(
    plainCode: string,
    hashedCodes: string[]
  ): { valid: boolean; remainingHashedCodes: string[] } {
    const targetHash = this.hashCode(plainCode.trim().toUpperCase());
    const index = hashedCodes.indexOf(targetHash);

    if (index === -1) {
      return { valid: false, remainingHashedCodes: hashedCodes };
    }

    // Single-use: remove consumed code from remaining
    const remaining = [...hashedCodes];
    remaining.splice(index, 1);
    return { valid: true, remainingHashedCodes: remaining };
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }
}
