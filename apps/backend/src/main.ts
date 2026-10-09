import { ConfigService } from '@nestjs/config';
import { createNestApp } from './bootstrap.js';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { NestTimeSyncService } from './clock/time-sync.service.js';

export async function bootstrap() {
  const maxAttempts = 20;
  let lastError: unknown;
  let desiredPort = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const app = await createNestApp();
    const env = app.get(ConfigService);
    const configService = app.get(BotConfigService);
    const timeSyncService = app.get(NestTimeSyncService);
    const envPort = Number(env.get('PORT'));
    const port =
      (Number.isFinite(envPort) && envPort > 0 ? envPort : 0) ||
      configService.getConfig().serverPort ||
      3000;
    desiredPort = port;

    try {
      if (attempt === 1) {
        await timeSyncService.sync();
      }
      await app.listen(port);
      return { app, port };
    } catch (err: unknown) {
      lastError = err;
      await app.close().catch(() => undefined);
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (code !== 'EADDRINUSE' || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  const code =
    lastError && typeof lastError === 'object' && 'code' in lastError ? String(lastError.code) : '';
  if (code === 'EADDRINUSE') {
    throw new Error(
      `Port ${desiredPort} is already in use. Stop the other process or set PORT to a free port.`
    );
  }
  throw lastError;
}

if (process.env.NODE_ENV !== 'test') {
  // If run directly via node/tsx src/main.ts
  const isDirect = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;
  if (isDirect) {
    bootstrap().catch(console.error);
  }
}
