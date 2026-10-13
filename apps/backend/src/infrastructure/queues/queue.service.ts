import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { RedisService } from '../redis/redis.service.js';
import { DatabaseService } from '../database/database.service.js';
import * as schema from '../database/schema/index.js';

export const QUEUE_SYMBOL_SYNC = 'safshekan-symbol-sync';
export const QUEUE_ORDER_ARCHIVE = 'safshekan-order-archive';

export interface OrderArchiveJobPayload {
  orderId: string;
  shotIndex: number;
  scheduledTime: string;
  firedAt: string;
  responseAt: string;
  latencyMs: number;
  httpStatus: number;
  isSuccess: boolean;
  brokerTrackingCode?: string;
  queueRank?: number;
  errorMessage?: string;
  rawRequestHeaders?: Record<string, string>;
  rawRequestPayload?: string;
  rawResponsePayload?: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private symbolSyncQueue: Queue | null = null;
  private orderArchiveQueue: Queue | null = null;
  private orderArchiveWorker: Worker | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly dbService: DatabaseService
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV !== 'test') {
      this.initializeQueues();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing BullMQ workers and queues...');
    try {
      if (this.orderArchiveWorker) {
        await Promise.race([
          this.orderArchiveWorker.close(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
        this.orderArchiveWorker = null;
      }
      if (this.symbolSyncQueue) {
        await Promise.race([
          this.symbolSyncQueue.close(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
        this.symbolSyncQueue = null;
      }
      if (this.orderArchiveQueue) {
        await Promise.race([
          this.orderArchiveQueue.close(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
        this.orderArchiveQueue = null;
      }
    } catch {
      // ignore
    }
  }

  private initializeQueues(): void {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || 6379);
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = Number(process.env.REDIS_DB || 0);

    const connection = {
      host,
      port,
      password,
      db,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (process.env.NODE_ENV === 'test' && times > 1) return null;
        return Math.min(times * 150, 3000);
      },
    };

    try {
      this.symbolSyncQueue = new Queue(QUEUE_SYMBOL_SYNC, { connection });
      this.orderArchiveQueue = new Queue(QUEUE_ORDER_ARCHIVE, {
        connection,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });

      // Worker for persisting order attempts off the hot path
      this.orderArchiveWorker = new Worker(
        QUEUE_ORDER_ARCHIVE,
        async (job: Job<OrderArchiveJobPayload>) => {
          await this.processOrderArchive(job.data);
        },
        { connection, concurrency: 5 }
      );

      this.orderArchiveWorker.on('failed', (job, err) => {
        this.logger.error(`Order archive job ${job?.id} failed: ${err.message}`);
      });

      this.logger.log('BullMQ queues initialized: symbol-sync & order-archive');
    } catch (err: unknown) {
      this.logger.warn(`Failed to initialize BullMQ: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async processOrderArchive(data: OrderArchiveJobPayload): Promise<void> {
    const db = this.dbService.db;
    await db.insert(schema.orderAttempts).values({
      orderId: data.orderId,
      shotIndex: data.shotIndex,
      scheduledTime: new Date(data.scheduledTime),
      firedAt: new Date(data.firedAt),
      responseAt: new Date(data.responseAt),
      latencyMs: data.latencyMs,
      httpStatus: data.httpStatus,
      isSuccess: data.isSuccess,
      brokerTrackingCode: data.brokerTrackingCode,
      queueRank: data.queueRank,
      errorMessage: data.errorMessage,
      rawRequestHeaders: data.rawRequestHeaders,
      rawRequestPayload: data.rawRequestPayload,
      rawResponsePayload: data.rawResponsePayload,
    });
  }

  /**
   * Enqueues an order shot attempt to be saved asynchronously without blocking the trading loop.
   */
  public async enqueueOrderArchive(payload: OrderArchiveJobPayload): Promise<void> {
    if (this.orderArchiveQueue) {
      try {
        await this.orderArchiveQueue.add('archive-shot', payload);
        return;
      } catch (err: unknown) {
        this.logger.warn(`Could not enqueue order archive to BullMQ: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    // Fallback: asynchronous direct insert
    void this.processOrderArchive(payload).catch((err) => {
      this.logger.error(`Fallback direct order archive failed: ${err.message}`);
    });
  }
}
