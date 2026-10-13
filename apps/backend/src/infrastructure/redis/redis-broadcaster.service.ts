import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ServerBroadcastMessage } from '@saf-shekan/core';
import { RedisService } from './redis.service.js';

const CHANNEL_EVENTS = 'safshekan:events';

export type EventCallback = (message: ServerBroadcastMessage) => void;

@Injectable()
export class RedisBroadcasterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisBroadcasterService.name);
  private localListener: EventCallback | null = null;
  private isSubscribed = false;

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    if (process.env.NODE_ENV !== 'test') {
      this.setupSubscriber();
    }
  }

  onModuleDestroy() {
    this.localListener = null;
  }

  public setLocalListener(listener: EventCallback | null): void {
    this.localListener = listener;
  }

  private setupSubscriber(): void {
    try {
      const sub = this.redisService.getSubscriber();
      sub.subscribe(CHANNEL_EVENTS, (err) => {
        if (err) {
          this.logger.warn(`Failed to subscribe to Redis events channel: ${err.message}`);
        } else {
          this.isSubscribed = true;
          this.logger.log(`Subscribed to Redis Pub/Sub channel: ${CHANNEL_EVENTS}`);
        }
      });

      sub.on('message', (channel, messageStr) => {
        if (channel === CHANNEL_EVENTS && this.localListener) {
          try {
            const parsed = JSON.parse(messageStr) as ServerBroadcastMessage;
            this.localListener(parsed);
          } catch {
            // ignore bad payload
          }
        }
      });
    } catch (err: unknown) {
      this.logger.warn(`Error initializing Redis event subscriber: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Publishes an event to all backend instances across the cluster.
   */
  public async publish(message: ServerBroadcastMessage): Promise<void> {
    try {
      const client = this.redisService.getClient();
      await client.publish(CHANNEL_EVENTS, JSON.stringify(message));
    } catch {
      // If Redis is temporarily unreachable, fall back to executing local listener directly
      if (this.localListener) {
        this.localListener(message);
      }
    }
  }
}
