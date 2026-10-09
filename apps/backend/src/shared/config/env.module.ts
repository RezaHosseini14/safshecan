import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const portRaw = config.PORT;
  if (typeof portRaw === 'string' && portRaw !== '') {
    const port = Number(portRaw);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new Error('PORT must be an integer between 1 and 65535');
    }
  }
  return config;
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateEnv,
    }),
  ],
})
export class EnvModule {}
