import { describe, expect, it, vi } from 'vitest';
import { DistributedLockService } from '../src/infrastructure/redis/distributed-lock.service.js';
import type { RedisService } from '../src/infrastructure/redis/redis.service.js';

describe('Distributed Lock with Fencing Tokens', () => {
  it('acquires lock and increments monotonic fencing token', async () => {
    let fenceCounter = 100;
    const store = new Map<string, string>();

    const mockRedisClient = {
      set: vi.fn().mockImplementation(async (key: string, val: string, _px: string, _ttl: number, _nx: string) => {
        if (store.has(key)) return null;
        store.set(key, val);
        return 'OK';
      }),
      incr: vi.fn().mockImplementation(async () => {
        fenceCounter++;
        return fenceCounter;
      }),
      eval: vi.fn().mockImplementation(async (_script: string, _numKeys: number, key: string, val: string) => {
        if (store.get(key) === val) {
          store.delete(key);
          return 1;
        }
        return 0;
      }),
      get: vi.fn().mockImplementation(async (key: string) => store.get(key) || null),
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as unknown as RedisService;

    const lockService = new DistributedLockService(mockRedisService);

    // 1. Acquire lock on resource
    const lock1 = await lockService.acquireLock('order:shot:IRO1FAZR0001', 5000);
    expect(lock1).not.toBeNull();
    expect(lock1?.fencingToken).toBe(101);

    // 2. Second concurrent attempt must fail because lock is held
    const lock2 = await lockService.acquireLock('order:shot:IRO1FAZR0001', 5000);
    expect(lock2).toBeNull();

    // 3. Release lock1 safely via Lua
    const released = await lock1?.release();
    expect(released).toBe(true);

    // 4. Third attempt succeeds after release and gets higher fencing token
    const lock3 = await lockService.acquireLock('order:shot:IRO1FAZR0001', 5000);
    expect(lock3).not.toBeNull();
    expect(lock3?.fencingToken).toBe(102);
    expect(lock3!.fencingToken).toBeGreaterThan(lock1!.fencingToken);

    await lock3?.release();
  });
});
