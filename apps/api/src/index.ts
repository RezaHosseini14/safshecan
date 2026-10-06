import 'reflect-metadata';
import chalk from 'chalk';
import open from 'open';
import { bootstrap } from './main.js';
import { AppConfigService } from './config/config.service.js';
import { NestTimeSyncService } from './time-sync/time-sync.service.js';

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
  const configService = app.get(AppConfigService);
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

  const dashboardUrl = `http://localhost:${port}`;
  const swaggerUrl = `http://localhost:${port}/api/docs`;

  console.log('\n' + chalk.bold.white('🌐 پنل مدیریت وب راه‌اندازی شد:'));
  console.log(chalk.bold.hex('#06B6D4')(`   👉 داشبورد: ${dashboardUrl}`));
  console.log(chalk.bold.hex('#F59E0B')(`   📖 مستندات Swagger: ${swaggerUrl}\n`));
  console.log(chalk.gray('• تنظیمات کارگزاری و ثبت cURL را از طریق داشبورد وب انجام دهید.'));
  console.log(chalk.gray('• برای اجرای محیط بدون مرورگر (مخصوص سرور VPS): pnpm cli\n'));

  // باز کردن خودکار داشبورد در مرورگر در صورت تنظیم
  if (config.autoOpenBrowser) {
    try {
      await open(dashboardUrl);
    } catch {
      // در محیط‌های headless یا ترمینال نادیده گرفته می‌شود
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
