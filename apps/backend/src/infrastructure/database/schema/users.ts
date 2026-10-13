import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    username: varchar('username', { length: 64 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 128 }),
    isActive: boolean('is_active').default(true).notNull(),
    totpSecretEncrypted: text('totp_secret_encrypted'),
    totpEnabled: boolean('totp_enabled').default(false).notNull(),
    totpRecoveryCodesHash: jsonb('totp_recovery_codes_hash').$type<string[]>(),
    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('users_username_idx').on(table.username),
    index('users_is_active_idx').on(table.isActive),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
