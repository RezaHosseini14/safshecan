import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { QueueService, type OrderArchiveJobPayload } from './queue.service.js';
import { DatabaseService } from '../database/database.service.js';
import * as schema from '../database/schema/index.js';

const FALLBACK_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'order-attempts.fallback.jsonl');
const MAX_BUFFER_SIZE = 5000;

@Injectable()
export class OrderDurabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderDurabilityService.name);
  private ringBuffer: OrderArchiveJobPayload[] = [];
  private fallbackWritesCount = 0;
  private replayedRecordsCount = 0;

  constructor(
    private readonly queueService: QueueService,
    private readonly dbService: DatabaseService
  ) {}

  async onModuleInit() {
    this.ensureDataDirectory();
    await this.replayFallbackFile();
  }

  async onModuleDestroy() {
    this.logger.log(`Flushing ${this.ringBuffer.length} order attempts on graceful shutdown...`);
    this.flushBufferToFallbackFile();
  }

  public recordAttempt(attempt: OrderArchiveJobPayload): void {
    // 1. Off the hot-path: push to memory buffer
    if (this.ringBuffer.length >= MAX_BUFFER_SIZE) {
      // Buffer full -> immediate fallback disk append to prevent any data loss
      this.writeFallback(attempt);
      return;
    }

    this.ringBuffer.push(attempt);

    // 2. Asynchronously dispatch to BullMQ off the hot path
    setImmediate(async () => {
      try {
        await this.queueService.enqueueOrderArchive(attempt);
        // Successfully enqueued; remove from local memory buffer
        const idx = this.ringBuffer.indexOf(attempt);
        if (idx !== -1) {
          this.ringBuffer.splice(idx, 1);
        }
      } catch (err: unknown) {
        // BullMQ/Redis unavailable -> write to append-only fallback file
        this.logger.warn(`BullMQ unavailable, writing order attempt to disk fallback: ${err instanceof Error ? err.message : String(err)}`);
        this.writeFallback(attempt);
        const idx = this.ringBuffer.indexOf(attempt);
        if (idx !== -1) {
          this.ringBuffer.splice(idx, 1);
        }
      }
    });
  }

  private writeFallback(attempt: OrderArchiveJobPayload): void {
    try {
      this.ensureDataDirectory();
      const line = JSON.stringify(attempt) + '\n';
      fs.appendFileSync(FALLBACK_FILE, line, { encoding: 'utf8' });
      this.fallbackWritesCount++;
    } catch (err: unknown) {
      this.logger.error(`CRITICAL: Failed to write fallback order attempt to disk: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private flushBufferToFallbackFile(): void {
    if (this.ringBuffer.length === 0) return;
    try {
      this.ensureDataDirectory();
      const lines = this.ringBuffer.map((item) => JSON.stringify(item)).join('\n') + '\n';
      fs.appendFileSync(FALLBACK_FILE, lines, { encoding: 'utf8' });
      this.fallbackWritesCount += this.ringBuffer.length;
      this.ringBuffer = [];
      this.logger.log('Flushed in-memory order attempts to fallback file.');
    } catch (err: unknown) {
      this.logger.error(`CRITICAL: Failed to flush order attempts on shutdown: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async replayFallbackFile(): Promise<number> {
    if (!fs.existsSync(FALLBACK_FILE)) {
      return 0;
    }

    this.logger.log(`Found fallback order attempts file at ${FALLBACK_FILE}, starting replay...`);
    const fileStream = fs.createReadStream(FALLBACK_FILE, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const attemptsToReplay: OrderArchiveJobPayload[] = [];
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as OrderArchiveJobPayload;
        attemptsToReplay.push(parsed);
      } catch {
        // skip malformed lines
      }
    }

    if (attemptsToReplay.length === 0) {
      fs.unlinkSync(FALLBACK_FILE);
      return 0;
    }

    const db = this.dbService.db;
    try {
      await db.transaction(async (tx) => {
        for (const item of attemptsToReplay) {
          await tx.insert(schema.orderAttempts).values({
            orderId: item.orderId,
            shotIndex: item.shotIndex,
            scheduledTime: new Date(item.scheduledTime),
            firedAt: new Date(item.firedAt),
            responseAt: new Date(item.responseAt),
            latencyMs: item.latencyMs,
            httpStatus: item.httpStatus,
            isSuccess: item.isSuccess,
            brokerTrackingCode: item.brokerTrackingCode,
            queueRank: item.queueRank,
            errorMessage: item.errorMessage,
            rawRequestHeaders: item.rawRequestHeaders,
            rawRequestPayload: item.rawRequestPayload,
            rawResponsePayload: item.rawResponsePayload,
          });
        }
      });

      this.replayedRecordsCount += attemptsToReplay.length;
      const replayedArchiveFile = `${FALLBACK_FILE}.replayed.${Date.now()}`;
      fs.renameSync(FALLBACK_FILE, replayedArchiveFile);
      this.logger.log(`Successfully replayed ${attemptsToReplay.length} fallback order attempts into database!`);
      return attemptsToReplay.length;
    } catch (err: unknown) {
      this.logger.error(`Failed to replay fallback order attempts into DB: ${err instanceof Error ? err.message : String(err)}`);
      return 0;
    }
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
  }

  public getMetrics() {
    return {
      bufferSize: this.ringBuffer.length,
      fallbackWritesTotal: this.fallbackWritesCount,
      replayedTotal: this.replayedRecordsCount,
    };
  }
}
