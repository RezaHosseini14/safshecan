import chalk from 'chalk';
import {
  HistoricalBacktester,
  HistoricalBacktestConfig,
} from './simulation/historical-backtester.js';

async function main() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║  📊 SafShekan - ابرموتور کوانت و شبیه‌ساز تاریخی ریزساختار بازار (HFT Backtest Engine)      ║'));
  console.log(chalk.bold.cyan('║     شبیه‌سازی میکروثانیه‌ای، تحلیل صف PAM بورس، شاخص شارپ و آزمون استرس مونت‌کارلو          ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════════════════════════════════╝\n'));

  const configs: Array<{ name: string; conf: HistoricalBacktestConfig }> = [
    {
      name: 'سناریو ۱: سرور ابری دیتاسنتر تهران (پینگ ۲ms | لیدتایم ۰.۸ms | ۵ شلیک | هسته تدبیرپرداز)',
      conf: {
        initialCapitalToman: 50_000_000,
        allocationMode: 'percent',
        positionSizingPercent: 30,
        connectionType: 'datacenter',
        brokerOMS: 'tadbir',
        leadTimeMs: 0.8,
        burstCount: 5,
        burstIntervalMs: 1.5,
        includeMonteCarlo: true,
        monteCarloIterations: 100,
      },
    },
    {
      name: 'سناریو ۲: فیبر نوری تانوما تهران (پینگ ۱۶ms | لیدتایم ۷.۲ms | ۵ شلیک | هسته هوشمند Auto)',
      conf: {
        initialCapitalToman: 50_000_000,
        allocationMode: 'percent',
        positionSizingPercent: 30,
        connectionType: 'fiber',
        brokerOMS: 'auto',
        leadTimeMs: 7.2,
        burstCount: 5,
        burstIntervalMs: 2.5,
        includeMonteCarlo: true,
        monteCarloIterations: 100,
      },
    },
    {
      name: 'سناریو ۳: اینترنت همراه 4G LTE (پینگ ۴۴ms | لیدتایم ۲۰.۵ms | ۵ شلیک | هسته رایان هم‌افزا)',
      conf: {
        initialCapitalToman: 50_000_000,
        allocationMode: 'percent',
        positionSizingPercent: 30,
        connectionType: 'mobile4g',
        brokerOMS: 'rayan',
        leadTimeMs: 20.5,
        burstCount: 5,
        burstIntervalMs: 3.5,
        includeMonteCarlo: false,
      },
    },
  ];

  for (const item of configs) {
    console.log(chalk.yellow.bold(`\n▶ در حال اجرای شبیه‌سازی: ${item.name}...`));
    const report = HistoricalBacktester.runBacktest(item.conf);

    console.log(chalk.gray('───────────────────────────────────────────────────────────────────────────────────────────────────────'));
    console.log(chalk.bold('نماد        صنعت                تاریخ       شلیک    رتبه صف    وضعیت معامله      سود خالص (تومان)    بازدهی'));
    console.log(chalk.gray('───────────────────────────────────────────────────────────────────────────────────────────────────────'));

    report.trades.slice(0, 15).forEach((t) => {
      let statusColor = chalk.gray;
      let statusLabel = 'نرسید';
      if (t.fillStatus === 'FILLED') {
        statusColor = chalk.green.bold;
        statusLabel = 'خرید ۱۰۰٪ ✓';
      } else if (t.fillStatus === 'PARTIAL') {
        statusColor = chalk.cyan.bold;
        statusLabel = `جزئی (${t.fillRatePercent}%)`;
      } else if (t.fillStatus === 'EARLY_REJECT') {
        statusColor = chalk.red.bold;
        statusLabel = 'ریجکت زودهنگام';
      }

      const pnlFormatted =
        t.netProfitToman > 0
          ? chalk.green(`+${t.netProfitToman.toLocaleString()} ت`)
          : t.netProfitToman < 0
          ? chalk.red(`${t.netProfitToman.toLocaleString()} ت`)
          : chalk.gray('۰ ت');

      const returnFormatted =
        t.tradeReturnPercent > 0
          ? chalk.green(`+${t.tradeReturnPercent}%`)
          : t.tradeReturnPercent < 0
          ? chalk.red(`${t.tradeReturnPercent}%`)
          : chalk.gray('۰%');

      const shotText = t.winningShotIndex > 0 ? `تیر #${t.winningShotIndex}` : '-';
      const sectorShort = (t.sector || 'عمومی').slice(0, 16).padEnd(18);

      console.log(
        `${t.symbol.padEnd(10)} ` +
        `${sectorShort} ` +
        `${t.listingDate}   ` +
        `${shotText.padEnd(7)} ` +
        `رتبه ${String(t.simulatedQueueRank).padStart(2)}   ` +
        `${statusColor(statusLabel.padEnd(15))} ` +
        `${pnlFormatted.padStart(20)}   ` +
        `${returnFormatted}`
      );
    });

    if (report.trades.length > 15) {
      console.log(chalk.gray(`... و ${report.trades.length - 15} نماد دیگر به طور کامل در کارنامه پردازش شدند.`));
    }

    console.log(chalk.gray('───────────────────────────────────────────────────────────────────────────────────────────────────────'));
    console.log(chalk.bold.magenta('📈 خلاصه عملکرد کارنامه کوانت و شاخص‌های مالی پیشرفته:'));
    console.log(` • سرمایه اولیه:          ${chalk.white(report.summary.initialCapitalToman.toLocaleString())} تومان`);
    console.log(` • سرمایه نهایی:          ${chalk.green.bold(report.summary.endingCapitalToman.toLocaleString())} تومان`);
    console.log(` • سود خالص کل:           ${chalk.green.bold('+' + report.summary.totalNetProfitToman.toLocaleString())} تومان (${chalk.bold.green('+' + report.summary.portfolioTotalReturnPercent + '%')})`);
    console.log(` • نرخ موفقیت سرخطی:      ${chalk.cyan.bold(report.summary.fillSuccessRatePercent + '%')} (${report.summary.filledTradesCount} خرید کامل + ${report.summary.partialTradesCount} خرید جزئی از ${report.summary.totalOpportunities} سهم)`);
    console.log(` • نرخ برد (Win Rate):    ${chalk.green(report.summary.winRatePercent + '%')} | نرخ باخت: ${chalk.red(report.summary.lossRatePercent + '%')}`);
    console.log(` • میانگین بازدهی معامله: ${chalk.green(report.summary.averageReturnPerTradePercent + '%')} (بردها: +${report.summary.averageWinReturnPercent}% | باخت‌ها: ${report.summary.averageLossReturnPercent}%)`);
    console.log(` • نسبت شارپ (Sharpe):    ${chalk.yellow.bold(report.summary.sharpeRatio)} | نسبت سورتینو (Sortino): ${chalk.yellow.bold(report.summary.sortinoRatio)}`);
    console.log(` • حداکثر افت (Max DD):   ${chalk.red(report.summary.maxDrawdownPercent + '%')} (مدت افت: ${report.summary.maxDrawdownDurationDays} روز)`);
    console.log(` • نسبت سود به ضرر (PF):  ${chalk.yellow(report.summary.profitFactor)} | امید ریاضی: ${chalk.cyan('+' + report.summary.expectancyPercent + '%')}`);
    console.log(` • ارزش در معرض ریسک:    VaR 95%: ${chalk.red(report.summary.valueAtRisk95Percent + '%')} | VaR 99%: ${chalk.red(report.summary.valueAtRisk99Percent + '%')}`);
    console.log(` • توزیع تاخیر پکت:       P50: ${report.summary.latencyStats.p50Ms}ms | P90: ${report.summary.latencyStats.p90Ms}ms | P99: ${report.summary.latencyStats.p99Ms}ms`);

    if (report.monteCarlo) {
      console.log(chalk.bold.blue('🎲 نتایج شبیه‌سازی آماری مونت کارلو (Monte Carlo 100 Runs):'));
      console.log(`   - بازدهی میانه (Median):    ${chalk.green.bold('+' + report.monteCarlo.medianReturnPercent + '%')}`);
      console.log(`   - بدبینانه‌ترین حالت (VaR 95%): ${chalk.yellow(report.monteCarlo.percentile5ReturnPercent + '%')}`);
      console.log(`   - خوش‌بینانه‌ترین حالت (Top 5%): ${chalk.green(report.monteCarlo.percentile95ReturnPercent + '%')}`);
      console.log(`   - احتمال کسب سود مثبت:     ${chalk.cyan.bold(report.monteCarlo.probabilityOfProfitPercent + '%')}`);
    }
  }

  console.log(chalk.bold.green('\n✅ تست داده‌های تاریخی و موتور شبیه‌ساز با موفقیت کامل انجام شد.\n'));
}

main().catch((err) => {
  console.error(chalk.red('خطا در اجرای بک‌تست تاریخی:'), err);
  process.exit(1);
});
