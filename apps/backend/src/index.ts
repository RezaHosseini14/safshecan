import 'reflect-metadata';
import chalk from 'chalk';
import open from 'open';
import { ConfigService } from '@nestjs/config';
import { bootstrap } from './main.js';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { NestTimeSyncService } from './clock/time-sync.service.js';

async function main() {
  console.clear();
  console.log(
    chalk.bold.hex('#10B981')(`
  ╔════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║      ⚡ صف‌شکن (SafShekan) - ربات سرخطی‌زن بورس تهران        ║
  ║      نسخه معماری مدرن NestJS با ساعت اتمی و رگبار میلی‌ثانیه‌ای ║
  ║                                                                ║
  ╚════════════════════════════════════════════════════════════════╝
  `)
  );

  console.log(chalk.cyan('⏳ در حال راه‌اندازی سرور NestJS و کالیبراسیون ساعت اتمی...'));

  const { app, port } = await bootstrap();
  const env = app.get(ConfigService);
  const configService = app.get(BotConfigService);
  const timeSyncService = app.get(NestTimeSyncService);
  const config = configService.getConfig();
  const syncStatus = timeSyncService.getStatus();

  if (syncStatus.synchronized) {
    console.log(
      chalk.green(
        `✓ زمان کالیبره شد: انحراف زمانی: ${syncStatus.offsetMs}ms | پینگ: ${syncStatus.rttMs}ms (${syncStatus.source})`
      )
    );
  } else {
    console.log(chalk.yellow('⚠ همگام‌سازی NTP ناموفق بود، از ساعت محلی استفاده می‌شود.'));
  }

  const apiUrl = `http://localhost:${port}`;
  const swaggerUrl = `http://localhost:${port}/api/docs`;

  console.log('\n' + chalk.bold.white('⚡ سرور راه‌اندازی شد (API + UI):'));
  console.log(chalk.bold.hex('#10B981')(`   👉 داشبورد: ${apiUrl}`));
  console.log(chalk.bold.hex('#06B6D4')(`   👉 API: ${apiUrl}/api`));
  console.log(chalk.bold.hex('#F59E0B')(`   📖 مستندات Swagger: ${swaggerUrl}\n`));
  console.log(chalk.gray('• داشبورد وب: pnpm dev:ui یا pnpm dev:frontend'));
  console.log(chalk.gray('• محیط بدون مرورگر (VPS): pnpm cli\n'));

  // Never auto-open under watch/dev restarts — each restart would spawn a new browser tab.
  const skipBrowser =
    env.get('SAF_SHEKAN_SKIP_BROWSER') === '1' ||
    env.get('SAF_SHEKAN_SKIP_BROWSER') === 'true' ||
    process.argv.includes('--watch');
  if (config.autoOpenBrowser && !skipBrowser) {
    try {
      await open(swaggerUrl);
    } catch {
      // headless / restricted environments
    }
  }

  // مدیریت خروج تمیز (Graceful Shutdown)
  const shutdown = async () => {
    console.log(chalk.yellow('\nدر حال متوقف‌سازی ربات و بستن سرور NestJS...'));
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(chalk.red('خطای بحرانی در اجرای برنامه:'), err);
  process.exit(1);
});
