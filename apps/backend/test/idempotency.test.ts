import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from '../src/infrastructure/security/idempotency.service.js';
import type { RedisService } from '../src/infrastructure/redis/redis.service.js';

describe('Idempotency Service', () => {
  it('prevents concurrent executions and returns cached result on completion', async () => {
    const store = new Map<string, string>();

    const mockRedisClient = {
      set: vi.fn().mockImplementation(async (key: string, val: string, ...args: unknown[]) => {
        const isNx = args.includes('NX');
        if (isNx && store.has(key)) {
          return null;
        }
        store.set(key, val);
        return 'OK';
      }),
      get: vi.fn().mockImplementation(async (key: string) => store.get(key) || null),
      del: vi.fn().mockImplementation(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as unknown as RedisService;

    const idempotencyService = new IdempotencyService(mockRedisService);
    const key = 'idem-req-998877';

    // 1. Initial attempt -> acquired
    const check1 = await idempotencyService.checkOrSet(key);
    expect(check1.isDuplicate).toBe(false);

    // 2. Concurrent duplicate while still PROCESSING -> throws ConflictException
    await expect(idempotencyService.checkOrSet(key)).rejects.toThrow(ConflictException);

    // 3. Operation completes and caches result
    const resultPayload = { success: true, orderId: 'ORD-1234' };
    await idempotencyService.complete(key, resultPayload);

    // 4. Repeated attempt with same idempotency key -> returns cached result without executing
    const check2 = await idempotencyService.checkOrSet(key);
    expect(check2.isDuplicate).toBe(true);
    expect(check2.cachedResult).toEqual(resultPayload);
  });
});
