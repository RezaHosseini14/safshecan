import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { closeDatabaseConnections, Database, getDrizzleDatabase } from './database.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: Database;

  constructor() {
    this.db = getDrizzleDatabase();
  }

  async onModuleDestroy() {
    await closeDatabaseConnections();
  }

  async isHealthy(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        ok: true,
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Database healthcheck probe failed: ${message}`);
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: message,
      };
    }
  }
}
