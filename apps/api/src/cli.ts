import chalk from 'chalk';
import readline from 'node:readline';
import { ConfigManager } from './config/config-manager.js';
import { TimeSyncService } from './core/time-sync.js';
import { ConnectionManager } from './core/connection-pool.js';
import { SniperEngine } from './core/sniper-engine.js';

async function runCli() {
  console.clear();
  console.log(chalk.bold.hex('#10B981')(`
  ╔════════════════════════════════════════════════════════════╗
  ║    ⚡ صف‌شکن (SafShekan) - ربات سرخطی‌زن بورس تهران      ║
  ║      نسخه ترمینال / VPS مخصوص سرورهای ابری و سرورهای داخلی ║
  ╚════════════════════════════════════════════════════════════╝
  `));

  const configManager = new ConfigManager();
  const config = configManager.getConfig();
  const timeSync = new TimeSyncService();
  const connectionManager = new ConnectionManager();
  const engine = new SniperEngine(config, timeSync, connectionManager);

  console.log(chalk.cyan('⏳ در حال همگام‌سازی زمان با سرورهای اتمی NTP...'));
  const syncStatus = await timeSync.sync();
  console.log(
    chalk.green(
      `✓ زمان کالیبره شد: انحراف ${syncStatus.offsetMs}ms | پینگ ${syncStatus.rttMs}ms | مرجع: ${syncStatus.source}`
    )
  );

  console.log('\n' + chalk.bold.yellow('📋 تنظیمات سرخطی فعلی:'));
  console.log(chalk.white(` • نماد هدف: `) + chalk.bold.green(config.order.symbol));
  console.log(chalk.white(` • سقف قیمت: `) + chalk.bold.green(config.order.price.toLocaleString('fa-IR') + ' ریال'));
  console.log(chalk.white(` • حجم سفارش: `) + chalk.bold.green(config.order.quantity.toLocaleString('fa-IR') + ' سهم'));
  console.log(chalk.white(` • ساعت هدف: `) + chalk.bold.magenta(config.timing.targetTime));
  console.log(chalk.white(` • جبران پینگ: `) + chalk.bold.cyan(config.timing.leadTimeMs + ' ms'));
  console.log(chalk.white(` • تعداد شلیک رگباری: `) + chalk.bold.cyan(config.timing.burstCount));
  console.log(chalk.white(` • فاصله شلیک‌ها: `) + chalk.bold.cyan(config.timing.burstIntervalMs + ' ms'));
  console.log(chalk.white(` • آدرس کارگزاری: `) + chalk.dim(config.network.targetUrl));

  engine.on('state_changed', (state) => {
    console.log(chalk.bgBlue.black(` [وضعیت] ${state} `));
  });

  engine.on('log', (log) => {
    const time = TimeSyncService.formatTime(new Date(), true);
    if (log.level === 'success') {
      console.log(chalk.green(`[${time}] ✓ ${log.text}`));
    } else if (log.level === 'warn') {
      console.log(chalk.yellow(`[${time}] ⚠ ${log.text}`));
    } else {
      console.log(chalk.gray(`[${time}] ℹ ${log.text}`));
    }
  });

  engine.on('shot_result', (shot) => {
    const color = shot.success ? chalk.bold.green : chalk.yellow;
    console.log(
      color(
        `🎯 [شلیک ${shot.shotIndex}] کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${shot.errorMessage || (shot.trackingCode ? `کد رهگیری: ${shot.trackingCode}` : 'پاسخ دریافت شد')}`
      )
    );
  });

  engine.on('sniper_completed', () => {
    console.log(chalk.bold.green('\n🎉 عملیات به پایان رسید. خروج با Ctrl+C'));
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n' + chalk.bold.white('دستورات قابل اجرا:'));
  console.log(' [1] مسلح‌سازی برای ساعت هدف (Arm)');
  console.log(' [2] شلیک آزمایشی فوری (Test Shot)');
  console.log(' [3] تست پینگ کارگزاری');
  console.log(' [4] همگام‌سازی مجدد ساعت (NTP)');
  console.log(' [0] خروج');

  const promptUser = () => {
    rl.question(chalk.cyan('\nانتخاب شما: '), async (answer) => {
      const choice = answer.trim();
      if (choice === '1') {
        const res = engine.arm();
        if (res.success) {
          console.log(chalk.bold.green(`✓ ${res.message}`));
        } else {
          console.log(chalk.bold.red(`✗ ${res.message}`));
        }
      } else if (choice === '2') {
        console.log(chalk.yellow('در حال ارسال یک شلیک آزمایشی...'));
        const shot = await engine.testManualShoot();
        console.log(
          chalk.white(`پاسخ دریافتی: کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${shot.rawResponse.slice(0, 100)}`)
        );
      } else if (choice === '3') {
        console.log(chalk.yellow('در حال پینگ گرفتن از سرور کارگزاری...'));
        const ping = await connectionManager.pingBroker(config.network.targetUrl);
        console.log(chalk.green(`✓ پینگ رفت و برگشت: ${ping}ms`));
      } else if (choice === '4') {
        const s = await timeSync.sync();
        console.log(chalk.green(`✓ انحراف زمان: ${s.offsetMs}ms | پینگ: ${s.rttMs}ms`));
      } else if (choice === '0') {
        process.exit(0);
      }
      promptUser();
    });
  };

  promptUser();
}

runCli().catch(console.error);
