import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDatabaseConnections, getDrizzleDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { sql } from 'drizzle-orm';

const MIGRATION_LOCK_ID = 987654321;

async function runMigrations() {
  console.log('--> Starting PostgreSQL database migration via Drizzle ORM...');
  const db = getDrizzleDatabase();
  
  // Resolve migrations directory in either dist or src layout
  const migrationsFolder = path.resolve(__dirname, '../../../drizzle/migrations');
  console.log(`--> Loading migration files from: ${migrationsFolder}`);

  console.log('--> Acquiring pg_advisory_lock for single-runner deployment...');
  await db.execute(sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`);

  try {
    await migrate(db, { migrationsFolder });
    console.log('✓ All database migrations applied successfully!');
  } catch (err: unknown) {
    console.error('::error::Migration failed:', err);
    process.exit(1);
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`).catch(() => {});
    await closeDatabaseConnections();
  }
}

void runMigrations();
