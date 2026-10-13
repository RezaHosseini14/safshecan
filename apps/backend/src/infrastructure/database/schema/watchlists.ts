import { index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.js';

export const watchlists = pgTable(
  'watchlists',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('watchlists_user_symbol_idx').on(table.userId, table.symbol),
    index('watchlists_user_id_idx').on(table.userId),
  ]
);

export type WatchlistRecord = typeof watchlists.$inferSelect;
export type NewWatchlistRecord = typeof watchlists.$inferInsert;
