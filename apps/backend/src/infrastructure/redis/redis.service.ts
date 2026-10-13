import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private readonly stampedeLocks = new Map<string, Promise<unknown>>();

  public getClient(): Redis {
    if (!this.client) {
      this.client = this.createRedisClient();
    }
    return this.client;
  }

  public getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = this.createRedisClient();
    }
    return this.subscriber;
  }

  onModuleInit() {
    if (process.env.NODE_ENV !== 'test') {
      this.getClient();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis client connections...');
    if (this.client) {
      try {
        this.client.disconnect();
      } catch {}
      this.client = null;
    }
    if (this.subscriber) {
      try {
        this.subscriber.disconnect();
      } catch {}
      this.subscriber = null;
    }
  }

  private createRedisClient(): Redis {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || 6379);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = Number(process.env.REDIS_DB || 0);

    const client = new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (process.env.NODE_ENV === 'test') return null; // don't hang tests if redis not running
        const delay = Math.min(times * 150, 3000);
        return delay;
      },
    });

    client.on('error', (err) => {
      // In dev or test when Redis container is not running, log cleanly without unhandled crash
      this.logger.warn(`Redis connection issue: ${err.message}`);
    });

    client.connect().catch((err) => {
      this.logger.warn(`Initial Redis connection attempt failed: ${err.message}`);
    });

    return client;
  }

  async isHealthy(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      const pong = await client.ping();
      return {
        ok: pong === 'PONG',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: message,
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.getClient().get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.getClient().set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.getClient().set(key, serialized);
      }
    } catch (err: unknown) {
      this.logger.warn(`Redis set failed for key ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.getClient().del(key);
    } catch (err: unknown) {
      this.logger.warn(`Redis del failed for key ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Cache-aside with single-flight stampede protection.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // Mutex promise in-memory to prevent duplicate simultaneous remote queries
    const existing = this.stampedeLocks.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const loader = (async () => {
      try {
        const fresh = await factory();
        await this.set(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        this.stampedeLocks.delete(key);
      }
    })();

    this.stampedeLocks.set(key, loader);
    return loader;
  }
}
