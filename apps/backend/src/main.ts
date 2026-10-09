import { ConfigService } from '@nestjs/config';
import type { TimeSyncStatus } from '@saf-shekan/core';
import { createNestApp } from './bootstrap.js';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { NestTimeSyncService } from './clock/time-sync.service.js';
import { TimeSyncScheduler } from './clock/time-sync.scheduler.js';

export async function bootstrap() {
  const maxAttempts = 20;
  let lastError: unknown;
  let desiredPort = 3000;
  let seeded: TimeSyncStatus | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const app = await createNestApp();
    const env = app.get(ConfigService);
    const configService = app.get(BotConfigService);
    const timeSyncService = app.get(NestTimeSyncService);
    const scheduler = app.get(TimeSyncScheduler);
    const envPort = Number(env.get('PORT'));
    const port =
      (Number.isFinite(envPort) && envPort > 0 ? envPort : 0) ||
      configService.getConfig().serverPort ||
      3000;
    desiredPort = port;

    try {
      if (!seeded) {
        seeded = await timeSyncService.sync();
      } else {
        timeSyncService.adoptStatus(seeded);
      }
      await app.listen(port);
      scheduler.broadcast(timeSyncService.getStatus());
      scheduler.start();
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
