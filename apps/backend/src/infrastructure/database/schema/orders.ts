import { bigint, boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.js';
import { botConfigs } from './bot-configs.js';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    botConfigId: uuid('bot_config_id')
      .references(() => botConfigs.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    isin: varchar('isin', { length: 32 }),
    side: varchar('side', { length: 8 }).notNull(), // 'BUY' | 'SELL'
    priceRials: bigint('price_rials', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull(),
    orderValueRials: bigint('order_value_rials', { mode: 'number' }).notNull(),
    status: varchar('status', { length: 32 }).default('PENDING').notNull(), // 'PENDING' | 'ARMED' | 'FIRING' | 'FILLED' | 'REJECTED' | 'CANCELLED' | 'FAILED'
    scheduledTargetTime: timestamp('scheduled_target_time', { withTimezone: true }).notNull(),
    firedAt: timestamp('fired_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    successfulShotIndex: integer('successful_shot_index'),
    brokerTrackingCode: varchar('broker_tracking_code', { length: 64 }),
    totalAttempts: integer('total_attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_symbol_idx').on(table.symbol),
    index('orders_status_idx').on(table.status),
    index('orders_scheduled_idx').on(table.scheduledTargetTime),
    index('orders_idempotency_idx').on(table.idempotencyKey),
  ]
);

export const orderAttempts = pgTable(
  'order_attempts',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    shotIndex: integer('shot_index').notNull(),
    scheduledTime: timestamp('scheduled_time', { withTimezone: true }).notNull(),
    firedAt: timestamp('fired_at', { withTimezone: true }).notNull(),
    responseAt: timestamp('response_at', { withTimezone: true }).notNull(),
    latencyMs: doublePrecision('latency_ms').notNull(),
    httpStatus: integer('http_status').notNull(),
    isSuccess: boolean('is_success').notNull(),
    brokerTrackingCode: varchar('broker_tracking_code', { length: 64 }),
    queueRank: integer('queue_rank'),
    errorMessage: text('error_message'),
    rawRequestHeaders: jsonb('raw_request_headers'),
    rawRequestPayload: text('raw_request_payload'),
    rawResponsePayload: text('raw_response_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('order_attempts_order_id_idx').on(table.orderId),
    index('order_attempts_shot_index_idx').on(table.shotIndex),
    index('order_attempts_is_success_idx').on(table.isSuccess),
    index('order_attempts_latency_idx').on(table.latencyMs),
  ]
);

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrderRecord = typeof orders.$inferInsert;
export type OrderAttemptRecord = typeof orderAttempts.$inferSelect;
export type NewOrderAttemptRecord = typeof orderAttempts.$inferInsert;
