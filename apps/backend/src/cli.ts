import chalk from 'chalk';
import readline from 'node:readline';
import { t } from '@saf-shekan/i18n';
import { BotConfigService } from './bot-config/bot-config.service.js';
import { MANUAL_TIME_SOURCE } from './clock/time-sync-policy.js';
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
  ║    ⚡ ${t('cli', 'banner')}
  ║      ${t('cli', 'bannerSub')}
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

  console.log(chalk.cyan(`⏳ ${t('cli', 'syncing')}`));
  const syncStatus = await timeSync.sync();
  console.log(
    chalk.green(
      `✓ ${t('cli', 'cliCalibrated', {
        offset: syncStatus.offsetMs,
        rtt: syncStatus.rttMs,
        source: sourceLabel(syncStatus.source),
      })}`
    )
  );

  console.log('\n' + chalk.bold.yellow(`📋 ${t('cli', 'settings')}`));
  console.log(chalk.white(` • ${t('cli', 'symbol')} `) + chalk.bold.green(config.order.symbol));
  console.log(
    chalk.white(` • ${t('cli', 'price')} `) +
      chalk.bold.green(t('cli', 'priceValue', { value: config.order.price.toLocaleString('fa-IR') }))
  );
  console.log(
    chalk.white(` • ${t('cli', 'quantity')} `) +
      chalk.bold.green(t('cli', 'quantityValue', { value: config.order.quantity.toLocaleString('fa-IR') }))
  );
  console.log(chalk.white(` • ${t('cli', 'target')} `) + chalk.bold.magenta(config.timing.targetTime));
  console.log(chalk.white(` • ${t('cli', 'lead')} `) + chalk.bold.cyan(config.timing.leadTimeMs + ' ms'));
  console.log(chalk.white(` • ${t('cli', 'burst')} `) + chalk.bold.cyan(config.timing.burstCount));
  console.log(chalk.white(` • ${t('cli', 'gap')} `) + chalk.bold.cyan(config.timing.burstIntervalMs + ' ms'));
  console.log(chalk.white(` • ${t('cli', 'url')} `) + chalk.dim(config.network.targetUrl));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n' + chalk.bold.white(t('cli', 'commands')));
  console.log(` [1] ${t('cli', 'arm')}`);
  console.log(` [2] ${t('cli', 'testShot')}`);
  console.log(` [3] ${t('cli', 'ping')}`);
  console.log(` [4] ${t('cli', 'resync')}`);
  console.log(` [0] ${t('cli', 'exit')}`);

  const promptUser = () => {
    rl.question(chalk.cyan(`\n${t('cli', 'prompt')} `), async (answer) => {
      const choice = answer.trim();
      if (choice === '1') {
        const res = engine.arm();
        console.log(res.success ? chalk.bold.green(`✓ ${res.message}`) : chalk.bold.red(`✗ ${res.message}`));
      } else if (choice === '2') {
        console.log(chalk.yellow(t('cli', 'testing')));
        const shot = await engine.testManualShoot();
        const body = typeof shot.rawResponse === 'string' ? shot.rawResponse : '';
        console.log(
          chalk.white(
            t('cli', 'shotBody', { status: shot.httpStatus, latency: shot.latencyMs, body: body.slice(0, 100) })
          )
        );
      } else if (choice === '3') {
        console.log(chalk.yellow(t('cli', 'pinging')));
        const ping = await connectionManager.pingBroker(config.network.targetUrl);
        console.log(chalk.green(`✓ ${t('cli', 'pingOk', { ms: ping })}`));
      } else if (choice === '4') {
        const synced = await timeSync.sync();
        console.log(
          chalk.green(`✓ ${t('cli', 'offsetOk', { offset: synced.offsetMs, rtt: synced.rttMs })}`)
        );
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
    console.log(chalk.bgBlue.black(` ${t('cli', 'state', { state: data.state ?? '' })} `));
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
        `🎯 ${t('cli', 'shot', {
          index: shot.shotIndex ?? '',
          status: shot.httpStatus ?? '',
          latency: shot.latencyMs ?? '',
          detail:
            shot.errorMessage ||
            (shot.trackingCode
              ? t('errors', 'tracking', { code: shot.trackingCode })
              : t('errors', 'responseReceived')),
        })}`
      )
    );
    return;
  }
  if (message.type === 'SNIPER_SUMMARY') {
    console.log(chalk.bold.green(`\n🎉 ${t('cli', 'finished')}`));
  }
}

function sourceLabel(source: string): string {
  return source === MANUAL_TIME_SOURCE ? t('errors', 'manualSource') : source;
}

runCli().catch(console.error);
