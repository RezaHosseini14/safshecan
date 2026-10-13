import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/database/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://safshekan:safshekan@127.0.0.1:5432/safshekan_db',
  },
  verbose: true,
  strict: true,
});
