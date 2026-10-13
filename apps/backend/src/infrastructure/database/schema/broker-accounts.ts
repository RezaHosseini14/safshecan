import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.js';

export const brokerAccounts = pgTable(
  'broker_accounts',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brokerType: varchar('broker_type', { length: 32 }).notNull(), // 'tadbir' | 'rayan' | 'mofid' | 'agah' | 'farabi' | 'sahra' | 'custom'
    accountName: varchar('account_name', { length: 128 }).notNull(),
    customerTitle: varchar('customer_title', { length: 128 }),
    customerCode: varchar('customer_code', { length: 64 }),
    customerId: varchar('customer_id', { length: 64 }),
    authType: varchar('auth_type', { length: 32 }).default('BEARER_JWT').notNull(),
    encryptedCredentials: text('encrypted_credentials').notNull(),
    keyVersion: integer('key_version').default(1).notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('broker_accounts_user_id_idx').on(table.userId),
    index('broker_accounts_type_idx').on(table.brokerType),
    index('broker_accounts_is_active_idx').on(table.isActive),
  ]
);

export type BrokerAccount = typeof brokerAccounts.$inferSelect;
export type NewBrokerAccount = typeof brokerAccounts.$inferInsert;
