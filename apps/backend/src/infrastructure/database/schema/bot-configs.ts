import { bigint, boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.js';
import { brokerAccounts } from './broker-accounts.js';

export const botConfigs = pgTable(
  'bot_configs',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brokerAccountId: uuid('broker_account_id')
      .references(() => brokerAccounts.id, { onDelete: 'set null' }),
    version: integer('version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Order Config
    symbol: varchar('symbol', { length: 32 }).notNull(),
    isin: varchar('isin', { length: 32 }),
    priceRials: bigint('price_rials', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull(),
    side: varchar('side', { length: 8 }).default('BUY').notNull(), // 'BUY' | 'SELL'
    brokerType: varchar('broker_type', { length: 32 }).default('custom').notNull(),
    antiDoubleSpend: boolean('anti_double_spend').default(true).notNull(),

    // Network Config
    targetUrl: text('target_url').notNull(),
    httpMethod: varchar('http_method', { length: 8 }).default('POST').notNull(),
    headersTemplate: jsonb('headers_template').$type<Record<string, string>>().default({}).notNull(),
    bodyTemplate: text('body_template').notNull(),
    maxSockets: integer('max_sockets').default(10).notNull(),
    timeoutMs: integer('timeout_ms').default(3000).notNull(),

    // Timing Config
    targetTime: varchar('target_time', { length: 16 }).default('08:45:00.000').notNull(),
    leadTimeMs: doublePrecision('lead_time_ms').default(22).notNull(),
    burstCount: integer('burst_count').default(6).notNull(),
    burstIntervalMs: doublePrecision('burst_interval_ms').default(3.5).notNull(),
    preWarmSeconds: integer('pre_warm_seconds').default(15).notNull(),
    stopOnFirstSuccess: boolean('stop_on_first_success').default(true).notNull(),
    ntpSyncIntervalMs: integer('ntp_sync_interval_ms').default(60000).notNull(),

    // System Preferences
    soundAlertEnabled: boolean('sound_alert_enabled').default(true).notNull(),
    autoOpenBrowser: boolean('auto_open_browser').default(false).notNull(),
    ntpServers: jsonb('ntp_servers').$type<string[]>().default(['ir.pool.ntp.org', 'time.google.com', 'pool.ntp.org']).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bot_configs_user_id_idx').on(table.userId),
    index('bot_configs_symbol_idx').on(table.symbol),
    index('bot_configs_is_active_idx').on(table.isActive),
  ]
);

export type BotConfigRecord = typeof botConfigs.$inferSelect;
export type NewBotConfigRecord = typeof botConfigs.$inferInsert;
