import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  cachedResult?: unknown;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Checks or sets an idempotency key in Redis.
   * If key already exists in 'PROCESSING' state, throws ConflictException.
   * If key already exists with completed payload, returns the cached result.
   */
  async checkOrSet(key: string, processingTtlSeconds = 300): Promise<IdempotencyCheckResult> {
    const redisKey = `safshekan:idempotency:${key}`;
    const client = this.redisService.getClient();

    try {
      // Try to atomically set the key in PROCESSING state
      const acquired = await client.set(redisKey, JSON.stringify({ status: 'PROCESSING' }), 'EX', processingTtlSeconds, 'NX');

      if (acquired === 'OK') {
        return { isDuplicate: false };
      }

      // Key already exists; read its current payload
      const existing = await client.get(redisKey);
      if (existing) {
        try {
          const parsed = JSON.parse(existing) as { status: string; result?: unknown };
          if (parsed.status === 'PROCESSING') {
            throw new ConflictException('Request with this idempotency key is already currently executing');
          }
          if (parsed.status === 'COMPLETED') {
            return { isDuplicate: true, cachedResult: parsed.result };
          }
        } catch (err: unknown) {
          if (err instanceof ConflictException) throw err;
        }
      }

      return { isDuplicate: true };
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      this.logger.warn(`Redis idempotency check failed: ${err instanceof Error ? err.message : String(err)}`);
      // Fail-open for availability if Redis is degraded, relying on DB unique constraint backstop
      return { isDuplicate: false };
    }
  }

  async complete(key: string, result: unknown, completedTtlSeconds = 86400): Promise<void> {
    const redisKey = `safshekan:idempotency:${key}`;
    try {
      await this.redisService.getClient().set(
        redisKey,
        JSON.stringify({ status: 'COMPLETED', result }),
        'EX',
        completedTtlSeconds
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to complete idempotency key: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async clear(key: string): Promise<void> {
    const redisKey = `safshekan:idempotency:${key}`;
    try {
      await this.redisService.getClient().del(redisKey);
    } catch {
      // ignore
    }
  }
}
