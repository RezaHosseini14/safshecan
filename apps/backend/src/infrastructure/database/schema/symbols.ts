import { bigint, boolean, index, integer, jsonb, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const symbols = pgTable(
  'symbols',
  {
    isin: varchar('isin', { length: 32 }).primaryKey(),
    symbol: varchar('symbol', { length: 32 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    insCode: varchar('ins_code', { length: 32 }),
    market: varchar('market', { length: 64 }),
    groupName: varchar('group_name', { length: 64 }),
    basePrice: bigint('base_price', { mode: 'number' }),
    closingPrice: bigint('closing_price', { mode: 'number' }),
    yesterdayPrice: bigint('yesterday_price', { mode: 'number' }),
    pMax: bigint('p_max', { mode: 'number' }),
    pMin: bigint('p_min', { mode: 'number' }),
    baseVolume: bigint('base_volume', { mode: 'number' }),
    volume: bigint('volume', { mode: 'number' }),
    value: bigint('value', { mode: 'number' }),
    tradesCount: integer('trades_count'),
    eps: integer('eps'),
    pe: numeric('pe', { precision: 8, scale: 2 }),
    isIpo: boolean('is_ipo').default(false).notNull(),
    ipoDetails: jsonb('ipo_details'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('symbols_symbol_idx').on(table.symbol),
    index('symbols_ins_code_idx').on(table.insCode),
    index('symbols_is_ipo_idx').on(table.isIpo),
    index('symbols_group_idx').on(table.groupName),
  ]
);

export type SymbolRecord = typeof symbols.$inferSelect;
export type NewSymbolRecord = typeof symbols.$inferInsert;
