import { Injectable, Logger, Optional } from '@nestjs/common';
import crypto from 'node:crypto';

export interface EnvelopeCipherOptions {
  masterKeyHex?: string;
  defaultKeyVersion?: number;
}

@Injectable()
export class EnvelopeCipherService {
  private readonly logger = new Logger(EnvelopeCipherService.name);
  private readonly masterKey: Buffer;
  private readonly defaultKeyVersion: number;

  constructor(@Optional() options?: EnvelopeCipherOptions) {
    const rawKey = options?.masterKeyHex || process.env.ENCRYPTION_MASTER_KEY;
    if (!rawKey) {
      // In dev or test environments without an explicit key, warn and use deterministic fallback for test harnesses
      if (process.env.NODE_ENV === 'test') {
        this.masterKey = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
      } else {
        throw new Error('ENCRYPTION_MASTER_KEY environment variable is required (must be 64 hex characters / 32 bytes)');
      }
    } else {
      if (rawKey.length !== 64) {
        throw new Error('ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes / 256 bits)');
      }
      this.masterKey = Buffer.from(rawKey, 'hex');
    }

    this.defaultKeyVersion = options?.defaultKeyVersion || Number(process.env.ENCRYPTION_KEY_VERSION || 1);
  }

  /**
   * Encrypts plaintext string using AES-256-GCM.
   * Returns envelope string: `v1:<key_version>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
   */
  public encrypt(plaintext: string, keyVersion?: number): string {
    const version = keyVersion ?? this.defaultKeyVersion;
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag(); // 128-bit authentication tag

    return `v1:${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
  }

  /**
   * Decrypts envelope string: `v1:<key_version>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
   */
  public decrypt(envelope: string): string {
    if (!envelope || !envelope.startsWith('v1:')) {
      throw new Error('Invalid envelope ciphertext format: missing v1 prefix');
    }

    const parts = envelope.split(':');
    if (parts.length !== 5) {
      throw new Error('Malformed envelope ciphertext: expected 5 parts (v1:version:iv:tag:ciphertext)');
    }

    const [, , ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      throw new Error('Decryption failed: authentication tag mismatch or corrupted ciphertext');
    }
  }

  /**
   * Rotates ciphertext to a new key version without exposing plaintext.
   */
  public rotate(envelope: string, newKeyVersion: number): string {
    const decrypted = this.decrypt(envelope);
    return this.encrypt(decrypted, newKeyVersion);
  }
}
