import chalk from 'chalk';
import readline from 'node:readline';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { NestTimeSyncService } from './clock/time-sync.service.js';
import { SniperEngine } from './engine/domain/sniper-engine.js';
import type { ServerBroadcastMessage } from '@saf-shekan/core';
import { UndiciOrderTransport } from './engine/undici-order-transport.js';
import { ConnectionPoolService } from './network/connection-pool.service.js';
import { formatExactTime } from './shared/time/format-time.js';

async function runCli() {
  console.clear();
  console.log(chalk.bold.hex('#10B981')(`
  ╔════════════════════════════════════════════════════════════╗
  ║    ⚡ صف‌شکن (SafShekan) - ربات سرخطی‌زن بورس تهران      ║
  ║      نسخه ترمینال / VPS مخصوص سرورهای ابری و سرورهای داخلی ║
  ╚════════════════════════════════════════════════════════════╝
  `));

  const configService = new BotConfigService();
  const config = configService.getConfig();
  const timeSync = new NestTimeSyncService(configService);
  const connectionManager = new ConnectionPoolService();
  const engine = new SniperEngine({
    clock: timeSync,
    transport: new UndiciOrderTransport(connectionManager),
    readConfig: () => configService.getConfig(),
    broadcaster: {
      connectedClients: () => 1,
      broadcast: (message: ServerBroadcastMessage) => printEngineMessage(message),
    },
  });

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
        console.log(res.success ? chalk.bold.green(`✓ ${res.message}`) : chalk.bold.red(`✗ ${res.message}`));
      } else if (choice === '2') {
        console.log(chalk.yellow('در حال ارسال یک شلیک آزمایشی...'));
        const shot = await engine.testManualShoot();
        const body = typeof shot.rawResponse === 'string' ? shot.rawResponse : '';
        console.log(chalk.white(`پاسخ دریافتی: کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${body.slice(0, 100)}`));
      } else if (choice === '3') {
        console.log(chalk.yellow('در حال پینگ گرفتن از سرور کارگزاری...'));
        const ping = await connectionManager.pingBroker(config.network.targetUrl);
        console.log(chalk.green(`✓ پینگ رفت و برگشت: ${ping}ms`));
      } else if (choice === '4') {
        const synced = await timeSync.sync();
        console.log(chalk.green(`✓ انحراف زمان: ${synced.offsetMs}ms | پینگ: ${synced.rttMs}ms`));
      } else if (choice === '0') {
        process.exit(0);
      }
      promptUser();
    });
  };

  promptUser();
}

function printEngineMessage(message: ServerBroadcastMessage): void {
  const time = formatExactTime(new Date(), true);
  if (message.type === 'STATE_CHANGE') {
    const data = message.data as { state?: string };
    console.log(chalk.bgBlue.black(` [وضعیت] ${data.state ?? ''} `));
    return;
  }
  if (message.type === 'SHOT_LOG') {
    const data = message.data as { level?: string; text?: string };
    if (data.level === 'success') console.log(chalk.green(`[${time}] ✓ ${data.text}`));
    else if (data.level === 'warn') console.log(chalk.yellow(`[${time}] ⚠ ${data.text}`));
    else console.log(chalk.gray(`[${time}] ℹ ${data.text}`));
    return;
  }
  if (message.type === 'ORDER_SHOT') {
    const shot = message.data as { success?: boolean; shotIndex?: number; httpStatus?: number; latencyMs?: number; errorMessage?: string; trackingCode?: string };
    const color = shot.success ? chalk.bold.green : chalk.yellow;
    console.log(
      color(
        `🎯 [شلیک ${shot.shotIndex}] کد ${shot.httpStatus} | تاخیر: ${shot.latencyMs}ms | ${shot.errorMessage || (shot.trackingCode ? `کد رهگیری: ${shot.trackingCode}` : 'پاسخ دریافت شد')}`
      )
    );
    return;
  }
  if (message.type === 'SNIPER_SUMMARY') {
    console.log(chalk.bold.green('\n🎉 عملیات به پایان رسید. خروج با Ctrl+C'));
  }
}

runCli().catch(console.error);
