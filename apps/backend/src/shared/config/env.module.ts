import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .length(64, 'ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes)')
    .optional(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters').optional(),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters').optional(),
});

function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | ');
    throw new Error(`Environment validation failed: ${errors}`);
  }

  // Enforce production mandatory secrets
  if (config.NODE_ENV === 'production') {
    if (!config.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production');
    }
    if (!config.ENCRYPTION_MASTER_KEY) {
      throw new Error('ENCRYPTION_MASTER_KEY (64 hex characters) is required in production');
    }
    if (!config.JWT_ACCESS_SECRET || !config.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
    }
  }

  return result.data as Record<string, unknown>;
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      validate: validateEnv,
    }),
  ],
})
export class EnvModule {}
