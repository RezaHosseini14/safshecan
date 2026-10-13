import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import type { JwtPayload } from './auth.types.js';

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function unbase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

@Injectable()
export class CryptoKeysService {
  private readonly logger = new Logger(CryptoKeysService.name);
  private privateKey: crypto.KeyObject;
  private publicKey: crypto.KeyObject;
  private keyId: string;

  constructor() {
    this.keyId = process.env.JWT_KEY_ID || 'safshekan-ed25519-v1';

    let privRaw = process.env.JWT_PRIVATE_KEY;
    let pubRaw = process.env.JWT_PUBLIC_KEY;

    // Handle escaped newlines in env variables
    if (privRaw) privRaw = privRaw.replace(/\\n/g, '\n');
    if (pubRaw) pubRaw = pubRaw.replace(/\\n/g, '\n');

    if (privRaw && pubRaw) {
      try {
        this.privateKey = crypto.createPrivateKey(privRaw);
        this.publicKey = crypto.createPublicKey(pubRaw);
        this.logger.log(`Initialized Ed25519 asymmetric keys with kid: ${this.keyId}`);
      } catch (err: unknown) {
        throw new Error(`Failed to load Ed25519 keys: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // In dev or test environments without explicit keys, generate an ephemeral Ed25519 keypair
      this.logger.warn('No JWT_PRIVATE_KEY/JWT_PUBLIC_KEY provided in environment. Generating ephemeral Ed25519 keypair for local session.');
      const pair = crypto.generateKeyPairSync('ed25519');
      this.privateKey = pair.privateKey;
      this.publicKey = pair.publicKey;
    }
  }

  /**
   * Signs a JWT using EdDSA (Ed25519) with RFC 8037 standard base64url encoding.
   */
  public signAccessToken(payload: JwtPayload, expiresInSeconds = 900): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = {
      alg: 'EdDSA',
      typ: 'JWT',
      kid: this.keyId,
    };

    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify(fullPayload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const signature = crypto.sign(null, Buffer.from(signingInput, 'utf8'), this.privateKey);
    const signatureB64 = base64url(signature);

    return `${signingInput}.${signatureB64}`;
  }

  /**
   * Verifies an EdDSA (Ed25519) JWT token.
   */
  public verifyAccessToken(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = unbase64url(signatureB64);

    const isValid = crypto.verify(
      null,
      Buffer.from(signingInput, 'utf8'),
      this.publicKey,
      signature
    );

    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(unbase64url(payloadB64).toString('utf8')) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT token has expired');
    }

    return payload;
  }
}
