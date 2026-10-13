import { pgTable, primaryKey, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users.js';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    name: varchar('name', { length: 64 }).notNull().unique(), // 'admin' | 'trader' | 'viewer'
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('roles_name_idx').on(table.name),
  ]
);

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    name: varchar('name', { length: 64 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('permissions_name_idx').on(table.name),
  ]
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_role_idx').on(table.roleId),
  ]
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_roles_user_idx').on(table.userId),
  ]
);

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
