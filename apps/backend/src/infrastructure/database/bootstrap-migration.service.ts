import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, desc } from 'drizzle-orm';
import type { BotConfig } from '@saf-shekan/core';
import { DatabaseService } from './database.service.js';
import * as schema from './schema/index.js';
import { EnvelopeCipherService } from '../security/envelope-cipher.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationSummary {
  success: boolean;
  sourceFile: string;
  backupFile: string;
  brokerAccountCreated: boolean;
  botConfigVersion: number;
  watchlistItemsCount: number;
  symbol: string;
  priceRials: number;
  quantity: number;
  targetTime: string;
}

@Injectable()
export class BootstrapMigrationService {
  private readonly logger = new Logger(BootstrapMigrationService.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly cipher: EnvelopeCipherService
  ) {}

  /**
   * Dedicated idempotent CLI migration running in a single PostgreSQL transaction.
   * Safe to re-run, preserves backup file, and outputs a structured summary.
   */
  public async migrateConfigInTransaction(): Promise<MigrationSummary> {
    const db = this.dbService.db;

    // Locate config.json across possible paths
    const candidatePaths = [
      '/opt/saf-shekan/config.json',
      path.resolve(process.cwd(), 'config.json'),
      path.resolve(process.cwd(), 'apps/backend/config.json'),
      path.resolve(__dirname, '../../../../config.json'),
      path.resolve(__dirname, '../../../config.json'),
    ];

    const configPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!configPath) {
      throw new Error('Could not locate config.json in standard directories (/opt/saf-shekan/config.json or project root)');
    }

    this.logger.log(`--> Reading configuration from: ${configPath}`);
    const raw = fs.readFileSync(configPath, 'utf8');
    const legacy: BotConfig = JSON.parse(raw);

    const backupFile = `${configPath}.migrated.${Date.now()}.bak`;

    return await db.transaction(async (tx) => {
      // 1. Ensure administrator user exists
      let admin = await tx.query.users?.findFirst({
        where: eq(schema.users.username, 'admin'),
      });

      if (!admin) {
        const [createdAdmin] = await tx
          .insert(schema.users)
          .values({
            username: 'admin',
            passwordHash: 'argon2id$v=19$m=65536,t=3,p=1$bootstrap_admin_hash_placeholder',
            fullName: 'Administrator',
            isActive: true,
          })
          .returning();
        admin = createdAdmin;

        const adminRole = await tx.query.roles?.findFirst({
          where: eq(schema.roles.name, 'admin'),
        });
        if (adminRole) {
          await tx
            .insert(schema.userRoles)
            .values({ userId: admin.id, roleId: adminRole.id })
            .onConflictDoNothing();
        }
      }

      // 2. Encrypt broker credentials with AES-256-GCM envelope cipher
      const credentialsPayload = JSON.stringify({
        authorization: legacy.network?.headers?.Authorization || '',
        cookies: legacy.network?.cookies || '',
        headers: legacy.network?.headers || {},
      });
      const encryptedCredentials = this.cipher.encrypt(credentialsPayload);

      let brokerAccountId: string;
      const existingAccount = await tx.query.brokerAccounts?.findFirst({
        where: eq(schema.brokerAccounts.userId, admin.id),
      });

      if (existingAccount) {
        await tx
          .update(schema.brokerAccounts)
          .set({
            brokerType: legacy.order?.brokerType || 'custom',
            accountName: legacy.account?.brokerName || 'Migrated Broker Account',
            customerTitle: legacy.account?.customerTitle,
            customerCode: legacy.account?.customerCode,
            customerId: legacy.account?.customerCode,
            authType: legacy.account?.authType || 'BEARER_JWT',
            encryptedCredentials,
            keyVersion: 1,
            isActive: true,
          })
          .where(eq(schema.brokerAccounts.id, existingAccount.id));
        brokerAccountId = existingAccount.id;
      } else {
        const [created] = await tx
          .insert(schema.brokerAccounts)
          .values({
            userId: admin.id,
            brokerType: legacy.order?.brokerType || 'custom',
            accountName: legacy.account?.brokerName || 'Migrated Broker Account',
            customerTitle: legacy.account?.customerTitle,
            customerCode: legacy.account?.customerCode,
            customerId: legacy.account?.customerCode,
            authType: legacy.account?.authType || 'BEARER_JWT',
            encryptedCredentials,
            keyVersion: 1,
            isActive: true,
          })
          .returning();
        brokerAccountId = created.id;
      }

      // 3. Extract non-secret template headers
      const safeHeaders: Record<string, string> = { ...(legacy.network?.headers || {}) };
      delete safeHeaders.Authorization;
      delete safeHeaders.authorization;
      delete safeHeaders.Cookie;
      delete safeHeaders.cookie;

      // 4. Create or update BotConfig (Versioned)
      const latestConfig = await tx.query.botConfigs?.findFirst({
        where: eq(schema.botConfigs.userId, admin.id),
        orderBy: [desc(schema.botConfigs.version)],
      });
      const nextVersion = latestConfig ? latestConfig.version + 1 : 1;

      // Deactivate prior versions
      await tx
        .update(schema.botConfigs)
        .set({ isActive: false })
        .where(eq(schema.botConfigs.userId, admin.id));

      await tx.insert(schema.botConfigs).values({
        userId: admin.id,
        brokerAccountId,
        version: nextVersion,
        isActive: true,
        symbol: legacy.order?.symbol || '',
        isin: legacy.order?.isin || 'IRO1FAZR0001',
        priceRials: legacy.order?.price || 25000,
        quantity: legacy.order?.quantity || 500,
        side: legacy.order?.side || 'BUY',
        brokerType: legacy.order?.brokerType || 'custom',
        antiDoubleSpend: legacy.order?.antiDoubleSpend ?? true,
        targetUrl: legacy.network?.targetUrl || '',
        httpMethod: legacy.network?.method || 'POST',
        headersTemplate: safeHeaders,
        bodyTemplate: legacy.network?.bodyTemplate || '',
        maxSockets: legacy.network?.maxSockets || 10,
        timeoutMs: legacy.network?.timeoutMs || 3000,
        targetTime: legacy.timing?.targetTime || '08:45:00.000',
        leadTimeMs: legacy.timing?.leadTimeMs ?? 22,
        burstCount: legacy.timing?.burstCount || 6,
        burstIntervalMs: legacy.timing?.burstIntervalMs || 3.5,
        preWarmSeconds: legacy.timing?.preWarmSeconds || 15,
        stopOnFirstSuccess: legacy.timing?.stopOnFirstSuccess ?? true,
        ntpSyncIntervalMs: legacy.timing?.ntpSyncIntervalMs || 60000,
        soundAlertEnabled: legacy.soundAlertEnabled ?? true,
        autoOpenBrowser: legacy.autoOpenBrowser ?? false,
        ntpServers: legacy.ntpServers || ['ir.pool.ntp.org', 'time.google.com', 'pool.ntp.org'],
      });

      // 5. Migrate watchlist
      let watchlistCount = 0;
      const watchlistPaths = [
        path.resolve(process.cwd(), 'data/watchlist.json'),
        path.resolve(process.cwd(), 'apps/backend/data/watchlist.json'),
      ];
      const watchlistPath = watchlistPaths.find((p) => fs.existsSync(p));
      if (watchlistPath) {
        try {
          const wlRaw = fs.readFileSync(watchlistPath, 'utf8');
          const wlList: string[] = JSON.parse(wlRaw);
          if (Array.isArray(wlList)) {
            for (let i = 0; i < wlList.length; i++) {
              await tx
                .insert(schema.watchlists)
                .values({ userId: admin.id, symbol: wlList[i], sortOrder: i })
                .onConflictDoNothing();
            }
            watchlistCount = wlList.length;
          }
        } catch {
          // ignore optional watchlist read
        }
      }

      // 6. Record Audit Log
      await tx.insert(schema.auditLogs).values({
        userId: admin.id,
        action: 'CLI_CONFIG_MIGRATED',
        entityType: 'bot_config',
        entityId: `v${nextVersion}`,
        details: { source: configPath, backup: backupFile },
      });

      // 7. Preserve backup file on disk without deleting original
      fs.copyFileSync(configPath, backupFile);

      return {
        success: true,
        sourceFile: configPath,
        backupFile,
        brokerAccountCreated: true,
        botConfigVersion: nextVersion,
        watchlistItemsCount: watchlistCount,
        symbol: legacy.order?.symbol || '',
        priceRials: legacy.order?.price || 25000,
        quantity: legacy.order?.quantity || 500,
        targetTime: legacy.timing?.targetTime || '08:45:00.000',
      };
    });
  }
}
