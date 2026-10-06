#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import {
  TSE_HOURS,
  calculateBuyFee,
  calculateSellFee,
  calculateBreakEvenPrice,
  estimateQueuePosition,
  DEFAULT_BROKER_PRESETS
} from '@saf-shekan/core';

const program = new Command();

const BANNER = `
${chalk.bold.hex('#38bdf8')('╔═════════════════════════════════════════════════════════════════════╗')}
${chalk.bold.hex('#38bdf8')('║')}   ${chalk.bold.hex('#10b981')('🚀 SafShekan (صف‌شکن)')} - ${chalk.hex('#e2e8f0')('TSE High-Speed IPO & Sarkhati Engine')}   ${chalk.bold.hex('#38bdf8')('║')}
${chalk.bold.hex('#38bdf8')('║')}   ${chalk.hex('#94a3b8')('Version 2.0.0 Monorepo • Ultra-Low Latency Turbo Pipeline')}       ${chalk.bold.hex('#38bdf8')('║')}
${chalk.bold.hex('#38bdf8')('╚═════════════════════════════════════════════════════════════════════╝')}
`;

program
  .name('saf-shekan')
  .description('Interactive terminal CLI for SafShekan Tehran Stock Exchange Bot')
  .version('2.0.0');

// Command: Status
program
  .command('status')
  .description('Check backend server and trading engine status')
  .option('-p, --port <port>', 'API Server port', '3880')
  .action(async (options) => {
    console.log(BANNER);
    console.log(chalk.cyan(`📡 Connecting to SafShekan API on http://127.0.0.1:${options.port}...`));
    try {
      const res = await fetch(`http://127.0.0.1:${options.port}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as any;
      console.log(chalk.green('✓ Backend Engine Connected!'));
      console.log(chalk.bold('\n[Engine Status]'));
      console.log(`  State:          ${chalk.yellow(data.state)}`);
      console.log(`  Target Time:    ${chalk.hex('#38bdf8')(data.config?.timing?.targetTime || 'N/A')}`);
      console.log(`  Symbol:         ${chalk.bold.green(data.config?.order?.symbol || 'N/A')}`);
      console.log(`  Lead Time:      ${chalk.magenta((data.config?.timing?.leadTimeMs ?? 0) + ' ms')}`);
      console.log(`  Time Sync:      ${data.timeSync?.synchronized ? chalk.green('SYNCED') : chalk.red('DRIFTING')} (Offset: ${data.timeSync?.offsetMs ?? 0}ms, RTT: ${data.timeSync?.rttMs ?? 0}ms)`);
    } catch (err: any) {
      console.log(chalk.red(`✕ Could not reach SafShekan backend: ${err.message}`));
      console.log(chalk.gray(`Tip: Start the backend using: pnpm --filter @saf-shekan/api start`));
    }
  });

// Command: Fee Calculator
program
  .command('fee')
  .description('Calculate TSE transaction fees, tax, and break-even price')
  .requiredOption('-p, --price <price>', 'Share price (Tomans)', Number)
  .requiredOption('-q, --quantity <quantity>', 'Number of shares', Number)
  .option('--farabourse', 'Is Farabourse symbol', false)
  .action((options) => {
    console.log(BANNER);
    const { price, quantity, farabourse } = options;
    const buy = calculateBuyFee(price, quantity, farabourse);
    const sell = calculateSellFee(price, quantity, farabourse);
    const breakEven = calculateBreakEvenPrice(price, farabourse);

    console.log(chalk.bold.hex('#f59e0b')('📊 TSE Fee & Capital Breakdown:'));
    console.log(`  Nominal Value:    ${chalk.bold(buy.tradeValue.toLocaleString('fa-IR'))} تومان`);
    console.log(`  Total Buy Cost:   ${chalk.yellow(buy.totalCost.toLocaleString('fa-IR'))} تومان (کارمزد خرید ۰.۳۷٪)`);
    console.log(`  Required Capital: ${chalk.green(buy.netValue.toLocaleString('fa-IR'))} تومان`);
    console.log(`  Total Sell Cost:  ${chalk.red(sell.totalCost.toLocaleString('fa-IR'))} تومان (کارمزد + مالیات ۰.۸۷٪)`);
    console.log(`  Break-even Price: ${chalk.bold.hex('#38bdf8')(breakEven.toLocaleString('fa-IR'))} تومان (${((breakEven - price) / price * 100).toFixed(2)}% رشد برای خروج بدون زیان)`);
  });

// Command: Queue Estimator
program
  .command('queue')
  .description('Estimate order queue rank based on millisecond arrival offset')
  .requiredOption('-d, --delta <deltaMs>', 'Delta from 08:45:00.000 (ms)', Number)
  .option('-l, --latency <latencyMs>', 'Broker roundtrip latency (ms)', Number, 25)
  .action((options) => {
    console.log(BANNER);
    const target = 1000;
    const arrival = target + options.delta;
    const estimate = estimateQueuePosition(arrival, target, options.latency);

    console.log(chalk.bold.cyan('🎯 TSE Order Book Queue Estimation:'));
    console.log(`  Arrival Delta:    ${options.delta >= 0 ? '+' : ''}${options.delta} ms`);
    console.log(`  Estimated Rank:   #${estimate.estimatedPosition}`);
    console.log(`  Queue Tier:       ${chalk.hex(estimate.queueTier === 'VIP_FRONT' ? '#10b981' : '#f59e0b')(estimate.queueTier)}`);
    console.log(`  Fill Probability: ${chalk.bold(estimate.successProbabilityPercent + '%')}`);
    console.log(`  Verdict:          ${chalk.italic(estimate.verdictFarsi)}`);
  });

// Command: Presets
program
  .command('presets')
  .description('List available pre-configured Iranian stock broker presets')
  .action(() => {
    console.log(BANNER);
    console.log(chalk.bold.hex('#10b981')('🏢 Iranian Broker Presets:'));
    DEFAULT_BROKER_PRESETS.forEach((p, idx) => {
      console.log(`  ${chalk.bold.hex('#38bdf8')(`${idx + 1}. [${p.id}]`)} ${chalk.bold(p.name)}`);
      console.log(`     ${chalk.gray(p.description)}`);
      console.log(`     URL: ${chalk.hex('#94a3b8')(p.defaultUrl)}`);
    });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
