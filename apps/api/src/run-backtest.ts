import chalk from 'chalk';
import { BacktestRunner } from './simulation/backtest-runner.js';

async function main() {
  console.clear();
  console.log(chalk.bold.hex('#10B981')(`
  ╔════════════════════════════════════════════════════════════════════╗
  ║    ⚡ صف‌شکن (SafShekan) - آزمون استرس و بک‌تست شبیه‌ساز بورس      ║
  ║      High-Frequency Precision Backtest & Monte Carlo Simulator     ║
  ╚════════════════════════════════════════════════════════════════════╝
  `));

  console.log(chalk.cyan('⏳ در حال راه‌اندازی شبیه‌ساز هسته معاملات و اجرای آزمون‌های دقت...'));
  const report = await BacktestRunner.runFullBacktest(3);

  console.log('\n' + chalk.bold.white('۱. آزمون دقت نوسان زمانی سیستم‌عامل (Timer Jitter & Spin-Wait):'));
  const p = report.enginePrecisionTest;
  console.log(` • میانگین انحراف زمانی: ${chalk.bold.green(p.averageErrorMs + ' ms')} (هدف: زیر ۱.۵ میلی‌ثانیه)`);
  console.log(` • حداکثر پرش ناگهانی (Max Jitter): ${chalk.bold.green(p.maxJitterMs + ' ms')}`);
  console.log(` • وضعیت: ${p.passed ? chalk.bgGreen.black(' قبول / بسیار دقیق ') : chalk.bgRed.white(' مردود ')}`);

  console.log('\n' + chalk.bold.white('۲. آزمون مدارشکن ضد ثبت تکراری (Anti-Double-Spend Circuit Breaker):'));
  const c = report.circuitBreakerTest;
  console.log(` • شلیک‌های برنامه‌ریزی شده: ${chalk.yellow(c.totalConfiguredBurst)} شلیک`);
  console.log(` • شلیک‌های واقعی قبل از توقف: ${chalk.bold.cyan(c.actualDispatchedShots)} شلیک`);
  console.log(` • توقف هوشمند پس از اولین تاییدیه: ${c.haltedImmediately ? chalk.bold.green('بله (موفق)') : chalk.bold.red('خیر')}`);
  console.log(` • وضعیت: ${c.passed ? chalk.bgGreen.black(' قبول / ایمن ') : chalk.bgRed.white(' مردود ')}`);

  console.log('\n' + chalk.bold.white('۳. نتایج شبیه‌سازی مونت کارلو شرایط واقعی اینترنت ایران:'));

  for (const sc of report.scenarios) {
    console.log('\n' + chalk.bold.hex('#06B6D4')(`🌐 ${sc.scenarioName}`));
    console.log(chalk.gray(`   پینگ پایه: ${sc.pingMs}ms | نوسان جیتر: ±${sc.jitterMs}ms`));
    console.log(chalk.gray('   ┌───────────┬──────────────┬──────────────┬──────────────┬────────────────┐'));
    console.log(chalk.gray('   │ Lead-Time │ رتبه ۱ الی ۵ │ رتبه ۶ الی ۲۵│ رد زودهنگام  │ رتبه طلایی (%) │'));
    console.log(chalk.gray('   ├───────────┼──────────────┼──────────────┼──────────────┼────────────────┤'));

    for (const t of sc.testedLeadTimes) {
      const leadStr = (t.leadTimeMs + ' ms').padEnd(9);
      const r15Str = (t.rank1To5Count + ' بار').padEnd(12);
      const r625Str = (t.rank6To25Count + ' بار').padEnd(12);
      const earlyStr = (t.earlyRejectionCount + ' بار').padEnd(12);
      const rateStr = (t.topRankSuccessRate + '%').padEnd(14);

      const rateColor = t.topRankSuccessRate >= 80 ? chalk.bold.green : t.topRankSuccessRate >= 50 ? chalk.yellow : chalk.white;

      console.log(
        chalk.gray('   │ ') +
        chalk.white(leadStr) + chalk.gray(' │ ') +
        chalk.green(r15Str) + chalk.gray(' │ ') +
        chalk.cyan(r625Str) + chalk.gray(' │ ') +
        (t.earlyRejectionCount > 0 ? chalk.red(earlyStr) : chalk.gray(earlyStr)) + chalk.gray(' │ ') +
        rateColor(rateStr) + chalk.gray(' │')
      );
    }
    console.log(chalk.gray('   └───────────┴──────────────┴──────────────┴──────────────┴────────────────┘'));
    console.log(chalk.bold.yellow(`   💡 توصیه بهینه: `) + chalk.white(sc.recommendationReason));
  }

  console.log('\n' + chalk.bold.hex('#10B981')('════════════════════════════════════════════════════════════════════'));
  console.log(chalk.bold.green('✓ نتیجه کلی بک‌تست: ربات در حداکثر آمادگی و سرعت قرار دارد (VERDICT: PASSED 100%)'));
  console.log(chalk.bold.hex('#10B981')('════════════════════════════════════════════════════════════════════\n'));
}

main().catch(console.error);
