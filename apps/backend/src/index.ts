import 'reflect-metadata';
import chalk from 'chalk';
import open from 'open';
import { t } from '@saf-shekan/i18n';
import { ConfigService } from '@nestjs/config';
import { bootstrap } from './main.js';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { MANUAL_TIME_SOURCE } from './clock/time-sync-policy.js';
import { NestTimeSyncService } from './clock/time-sync.service.js';

async function main() {
  console.clear();
  console.log(
    chalk.bold.hex('#10B981')(`
  ╔════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║      ⚡ ${t('cli', 'nestBanner')}
  ║      ${t('cli', 'nestBannerSub')}
  ║                                                                ║
  ╚════════════════════════════════════════════════════════════════╝
  `)
  );

  console.log(chalk.cyan(`⏳ ${t('cli', 'bootWait')}`));

  const { app, port } = await bootstrap();
  const env = app.get(ConfigService);
  const configService = app.get(BotConfigService);
  const timeSyncService = app.get(NestTimeSyncService);
  const config = configService.getConfig();
  const syncStatus = timeSyncService.getStatus();

  if (syncStatus.synchronized) {
    console.log(
      chalk.green(
        `✓ ${t('cli', 'calibrated', {
          offset: syncStatus.offsetMs,
          rtt: syncStatus.rttMs,
          source: syncStatus.source === MANUAL_TIME_SOURCE ? t('errors', 'manualSource') : syncStatus.source,
        })}`
      )
    );
  } else {
    console.log(chalk.yellow(`⚠ ${t('cli', 'ntpFailed')}`));
  }

  const apiUrl = `http://localhost:${port}`;
  const swaggerUrl = `http://localhost:${port}/api/docs`;

  console.log('\n' + chalk.bold.white(`⚡ ${t('cli', 'serverUp')}`));
  console.log(chalk.bold.hex('#10B981')(`   👉 ${t('cli', 'dashboard', { url: apiUrl })}`));
  console.log(chalk.bold.hex('#06B6D4')(`   👉 API: ${apiUrl}/api`));
  console.log(chalk.bold.hex('#F59E0B')(`   📖 ${t('cli', 'swagger', { url: swaggerUrl })}\n`));
  console.log(chalk.gray(`• ${t('cli', 'hintUi')}`));
  console.log(chalk.gray(`• ${t('cli', 'hintCli')}\n`));

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
    console.log(chalk.yellow(`\n${t('cli', 'stopping')}`));
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(chalk.red(t('cli', 'fatal')), err);
  process.exit(1);
});
