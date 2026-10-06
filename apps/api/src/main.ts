import { createNestApp } from './bootstrap.js';
import { AppConfigService } from './config/config.service.js';
import { NestTimeSyncService } from './time-sync/time-sync.service.js';

export async function bootstrap() {
  const app = await createNestApp();
  const configService = app.get(AppConfigService);
  const timeSyncService = app.get(NestTimeSyncService);

  // همگام‌سازی اولیه ساعت اتمی
  await timeSyncService.sync();

  const desiredPort = configService.getConfig().serverPort || 3880;

  try {
    await app.listen(desiredPort);
    return { app, port: desiredPort };
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = desiredPort + 1;
      await app.listen(fallbackPort);
      return { app, port: fallbackPort };
    }
    throw err;
  }
}

if (process.env.NODE_ENV !== 'test') {
  // If run directly via node/tsx src/main.ts
  const isDirect = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;
  if (isDirect) {
    bootstrap().catch(console.error);
  }
}
