import { Logger } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
export const POSTGRES_CLIENT = Symbol('POSTGRES_CLIENT');

export type Database = PostgresJsDatabase<typeof schema>;

let clientInstance: postgres.Sql | null = null;
let dbInstance: Database | null = null;

export function getPostgresClient(connectionString?: string): postgres.Sql {
  if (!clientInstance) {
    const url =
      connectionString ||
      process.env.DATABASE_URL ||
      'postgres://safshekan:safshekan_dev_pass@127.0.0.1:5432/safshekan';

    const maxConnections = Number(process.env.DATABASE_POOL_MAX || 20);
    const statementTimeout = Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS || 10000);

    clientInstance = postgres(url, {
      max: maxConnections,
      idle_timeout: 30,
      connect_timeout: 10,
      max_lifetime: 1800, // 30 minutes
      connection: {
        statement_timeout: statementTimeout,
      },
      onnotice: () => {}, // silence routine notice logs
    });
  }
  return clientInstance;
}

export function getDrizzleDatabase(connectionString?: string): Database {
  if (!dbInstance) {
    const client = getPostgresClient(connectionString);
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export async function closeDatabaseConnections(): Promise<void> {
  if (clientInstance) {
    const logger = new Logger('Database');
    logger.log('Closing PostgreSQL connection pool...');
    await clientInstance.end({ timeout: 5 });
    clientInstance = null;
    dbInstance = null;
  }
}
