import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { RedisService } from './redis.service.js';

export interface DistributedLock {
  resource: string;
  lockId: string;
  fencingToken: number;
  release: () => Promise<boolean>;
}

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Acquires a distributed lock using single-instance algorithm (SET NX PX)
   * with a monotonically increasing fencing token.
   * @param resource Resource name (e.g. `order:shot:IRO1FAZR0001`)
   * @param ttlMs Time-to-live in milliseconds (default 5000ms)
   */
  async acquireLock(resource: string, ttlMs = 5000): Promise<DistributedLock | null> {
    const lockKey = `safshekan:lock:${resource}`;
    const fenceKey = `safshekan:lock:fence:${resource}`;
    const lockId = crypto.randomUUID();
    const client = this.redisService.getClient();

    try {
      const result = await client.set(lockKey, lockId, 'PX', ttlMs, 'NX');
      if (result !== 'OK') {
        this.logger.debug(`Failed to acquire lock for resource: ${resource}`);
        return null;
      }

      // Monotonically increasing fencing token
      const fencingToken = await client.incr(fenceKey);

      let released = false;
      const release = async (): Promise<boolean> => {
        if (released) return true;
        try {
          const res = await client.eval(RELEASE_LOCK_LUA, 1, lockKey, lockId);
          released = true;
          return res === 1;
        } catch (err: unknown) {
          this.logger.warn(`Error releasing lock ${lockKey}: ${err instanceof Error ? err.message : String(err)}`);
          return false;
        }
      };

      return {
        resource,
        lockId,
        fencingToken,
        release,
      };
    } catch (err: unknown) {
      this.logger.warn(`Redis lock acquisition failed for ${resource}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async getLastFencingToken(resource: string): Promise<number> {
    const fenceKey = `safshekan:lock:fence:${resource}`;
    const val = await this.redisService.getClient().get(fenceKey);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Executes a callback within a distributed lock, releasing it automatically.
   */
  async withLock<T>(resource: string, ttlMs: number, action: () => Promise<T>): Promise<T | null> {
    const lock = await this.acquireLock(resource, ttlMs);
    if (!lock) return null;
    try {
      return await action();
    } finally {
      await lock.release();
    }
  }
}
