import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HistoricalIPO {
  symbol: string;
  name: string;
  sector: string;
  market: string;
  listingDate: string;
  ipoPrice: number; // Rials
  dailyLimitPercent: number;
  lockupDays: number;
  totalRunReturnPercent: number;
  openingQueueShares: number;
  openingQueueValueToman: number;
  day1TradedShares: number;
  baseVolume: number;
  maxFillableRank: number;
  avgCompetitorArrivalMs: number;
  competitorDensity: number;
  retailQuotaToman: number;
  description: string;
}

export type BrokerOMSType = 'auto' | 'tadbir' | 'rayan' | 'dotin' | 'asan' | 'sahra';

export interface BrokerOMSProfile {
  id: BrokerOMSType;
  name: string;
  engineName: string;
  brokers: string[];
  baseDelayMs: number;
  jitterMs: number;
  burstCapacity: number;
  gatewayQuotaBonus: number;
}

export const BROKER_OMS_PROFILES: Record<BrokerOMSType, BrokerOMSProfile> = {
  auto: {
    id: 'auto',
    name: 'تخصیص بهینه هوشمند (Auto OMS)',
    engineName: 'Smart Multi-Gateway Broker Pool',
    brokers: ['مفید', 'آگاه', 'فارابی', 'مبین سرمایه', 'کاریزما'],
    baseDelayMs: 1.0,
    jitterMs: 0.3,
    burstCapacity: 25,
    gatewayQuotaBonus: 2,
  },
  tadbir: {
    id: 'tadbir',
    name: 'تدبیرپرداز (Tadbir Engine)',
    engineName: 'Tadbir Brokerage Gateway',
    brokers: ['کارگزاری مفید', 'کارگزاری سامان', 'کارگزاری اقتصاد بیدار', 'کارگزاری بانک ملی'],
    baseDelayMs: 1.2,
    jitterMs: 0.4,
    burstCapacity: 20,
    gatewayQuotaBonus: 2,
  },
  rayan: {
    id: 'rayan',
    name: 'رایان هم‌افزا (Rayan Bourse)',
    engineName: 'Rayan OMS Core',
    brokers: ['مبین سرمایه', 'بانک پاسارگاد', 'بانک تجارت', 'سهم آشنا'],
    baseDelayMs: 2.2,
    jitterMs: 0.6,
    burstCapacity: 15,
    gatewayQuotaBonus: 1,
  },
  dotin: {
    id: 'dotin',
    name: 'داتین (Dotin Core)',
    engineName: 'Dotin Financial Gateway',
    brokers: ['کارگزاری فارابی (نسخه جدید)', 'بانک پاسارگاد', 'خاورمیانه'],
    baseDelayMs: 1.7,
    jitterMs: 0.4,
    burstCapacity: 18,
    gatewayQuotaBonus: 1,
  },
  asan: {
    id: 'asan',
    name: 'آسان بورس (Asan Bourse)',
    engineName: 'Asan Cloud OMS',
    brokers: ['کاریزما', 'کیان', 'حافظ', 'صبا جهاد'],
    baseDelayMs: 2.6,
    jitterMs: 0.7,
    burstCapacity: 14,
    gatewayQuotaBonus: 0,
  },
  sahra: {
    id: 'sahra',
    name: 'صحرا (Sahra Engine)',
    engineName: 'Sahra Legacy & Next-Gen OMS',
    brokers: ['کارگزاری آگاه', 'کارگزاری سینا', 'توسعه صادرات'],
    baseDelayMs: 3.2,
    jitterMs: 0.9,
    burstCapacity: 12,
    gatewayQuotaBonus: 0,
  },
};

export interface HistoricalBacktestConfig {
  initialCapitalToman: number;
  allocationMode?: 'fixed' | 'percent' | 'kelly' | 'risk_parity';
  fixedAllocationToman?: number;
  positionSizingPercent?: number; // 5% to 100%
  connectionType: 'datacenter' | 'fiber' | 'mobile4g' | 'adsl' | 'custom';
  customPingMs?: number;
  customJitterMs?: number;
  brokerOMS?: BrokerOMSType;
  leadTimeMs?: number;
  burstCount?: number;
  burstIntervalMs?: number;
  targetSymbols?: string[];
  targetSectors?: string[];
  includeMonteCarlo?: boolean;
  monteCarloIterations?: number;
}

export interface HistoricalTradeResult {
  symbol: string;
  name: string;
  sector: string;
  listingDate: string;
  ipoPrice: number;
  allocatedCapitalToman: number;
  sharesRequested: number;
  sharesFilled: number;
  winningShotIndex: number;
  arrivalDeltaMs: number;
  simulatedQueueRank: number;
  fillStatus: 'FILLED' | 'PARTIAL' | 'NOT_FILLED' | 'EARLY_REJECT';
  fillRatePercent: number;
  grossProfitToman: number;
  commissionToman: number;
  netProfitToman: number;
  tradeReturnPercent: number;
  lockupDays: number;
  exitReason: string;
}

export interface EquityCurvePoint {
  tradeIndex: number;
  date: string;
  symbol: string;
  portfolioValueToman: number;
  drawdownPercent: number;
}

export interface MonteCarloAnalysis {
  iterations: number;
  medianReturnPercent: number;
  percentile5ReturnPercent: number;
  percentile95ReturnPercent: number;
  probabilityOfProfitPercent: number;
  monteCarloDrawdown95Percent: number;
  samplePaths: Array<{
    name: string;
    finalReturnPercent: number;
    path: number[];
  }>;
}

export interface HistoricalBacktestReport {
  summary: {
    initialCapitalToman: number;
    endingCapitalToman: number;
    totalNetProfitToman: number;
    portfolioTotalReturnPercent: number;
    totalOpportunities: number;
    filledTradesCount: number;
    partialTradesCount: number;
    missedTradesCount: number;
    earlyRejectionsCount: number;
    fillSuccessRatePercent: number;
    winRatePercent: number;
    lossRatePercent: number;
    averageReturnPerTradePercent: number;
    averageWinReturnPercent: number;
    averageLossReturnPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdownPercent: number;
    maxDrawdownDurationDays: number;
    profitFactor: number;
    expectancyToman: number;
    expectancyPercent: number;
    payoffRatio: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    valueAtRisk95Percent: number;
    valueAtRisk99Percent: number;
    connectionType: string;
    brokerOMS: string;
    leadTimeMs: number;
    burstCount: number;
    burstIntervalMs: number;
    latencyStats: {
      p50Ms: number;
      p90Ms: number;
      p95Ms: number;
      p99Ms: number;
      minMs: number;
      maxMs: number;
    };
  };
  equityCurve: EquityCurvePoint[];
  trades: HistoricalTradeResult[];
  monteCarlo?: MonteCarloAnalysis;
}

export class HistoricalBacktester {
  private static iposCache: HistoricalIPO[] | null = null;

  public static loadHistoricalIPOs(): HistoricalIPO[] {
    if (this.iposCache) return this.iposCache;

    const candidatePaths = [
      path.resolve(__dirname, '../data/historical-ipos.json'),
      path.resolve(process.cwd(), 'src/data/historical-ipos.json'),
      path.resolve(process.cwd(), 'apps/api/src/data/historical-ipos.json'),
      path.resolve(process.cwd(), 'dist/data/historical-ipos.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          this.iposCache = JSON.parse(raw);
          return this.iposCache!;
        } catch {
          // continue checking other paths
        }
      }
    }

    throw new Error('Historical IPO data file not found!');
  }

  public static getNetworkProfile(
    type: string,
    customPing?: number,
    customJitter?: number
  ): { pingMs: number; jitterMs: number; defaultOptimalLeadMs: number } {
    switch (type) {
      case 'datacenter':
        return { pingMs: 2.0, jitterMs: 0.4, defaultOptimalLeadMs: 0.8 };
      case 'fiber':
        return { pingMs: 16.0, jitterMs: 2.0, defaultOptimalLeadMs: 7.2 };
      case 'mobile4g':
        return { pingMs: 44.0, jitterMs: 6.0, defaultOptimalLeadMs: 20.5 };
      case 'adsl':
        return { pingMs: 75.0, jitterMs: 14.0, defaultOptimalLeadMs: 34.0 };
      case 'custom': {
        const ping = Math.max(0.5, customPing || 20);
        const jitter = Math.max(0.1, customJitter || 2.5);
        return {
          pingMs: ping,
          jitterMs: jitter,
          defaultOptimalLeadMs: Number((ping / 2 - 0.8).toFixed(1)),
        };
      }
      default:
        return { pingMs: 16.0, jitterMs: 2.0, defaultOptimalLeadMs: 7.2 };
    }
  }

  // Box-Muller Gaussian Noise generator
  public static gaussianRandom(mean = 0, stdev = 1): number {
    const u = Math.max(1e-9, 1 - Math.random());
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdev;
  }

  /**
   * Run a single comprehensive historical backtest iteration
   */
  public static runBacktest(config: HistoricalBacktestConfig): HistoricalBacktestReport {
    const allIpos = this.loadHistoricalIPOs();

    // Filtering by symbols or sectors if provided
    let ipos = allIpos;
    if (config.targetSymbols && config.targetSymbols.length > 0) {
      ipos = ipos.filter((item) => config.targetSymbols!.includes(item.symbol));
    }
    if (config.targetSectors && config.targetSectors.length > 0) {
      ipos = ipos.filter((item) => config.targetSectors!.includes(item.sector));
    }
    if (ipos.length === 0) {
      ipos = allIpos;
    }

    const net = this.getNetworkProfile(config.connectionType, config.customPingMs, config.customJitterMs);
    const effectiveLeadTimeMs =
      typeof config.leadTimeMs === 'number' ? config.leadTimeMs : net.defaultOptimalLeadMs;
    const burstCount = Math.max(1, config.burstCount || 5);
    const burstIntervalMs = Math.max(0.5, config.burstIntervalMs || 2.5);

    const omsKey = config.brokerOMS || 'auto';
    const oms = BROKER_OMS_PROFILES[omsKey] || BROKER_OMS_PROFILES.auto;

    let currentCapitalToman = config.initialCapitalToman;
    let peakCapitalToman = currentCapitalToman;
    let maxDrawdownPercent = 0;
    let currentDdDuration = 0;
    let maxDdDuration = 0;

    const trades: HistoricalTradeResult[] = [];
    const equityCurve: EquityCurvePoint[] = [
      {
        tradeIndex: 0,
        date: 'شروع پورتفوی',
        symbol: 'INIT',
        portfolioValueToman: currentCapitalToman,
        drawdownPercent: 0,
      },
    ];

    let filledCount = 0;
    let partialCount = 0;
    let missedCount = 0;
    let earlyRejectionsCount = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    let consecutiveWinCurrent = 0;
    let maxConsecutiveWins = 0;
    let consecutiveLossCurrent = 0;
    let maxConsecutiveLosses = 0;

    const allArrivalLatencies: number[] = [];

    const COMMISSION_BUY_RATE = 0.003712; // 0.3712%
    const COMMISSION_SELL_RATE = 0.0088; // 0.88%
    const TOTAL_COMMISSION_RATE = COMMISSION_BUY_RATE + COMMISSION_SELL_RATE; // ~1.2512%

    const baseTransitMs = net.pingMs / 2;

    ipos.forEach((ipo, idx) => {
      // 1. Position Sizing Model
      let allocatedCapitalToman = 0;
      const mode = config.allocationMode || 'fixed';

      if (mode === 'percent') {
        const percent = Math.min(100, Math.max(5, config.positionSizingPercent || 30));
        allocatedCapitalToman = Math.floor(currentCapitalToman * (percent / 100));
      } else if (mode === 'kelly') {
        // Fractional Half-Kelly based on expected payoff
        const pWin = 0.75;
        const bRatio = 2.5;
        const kellyFraction = Math.max(0.1, (pWin * (bRatio + 1) - 1) / bRatio);
        const halfKelly = Math.min(0.4, kellyFraction * 0.5);
        allocatedCapitalToman = Math.floor(currentCapitalToman * halfKelly);
      } else if (mode === 'risk_parity') {
        // Volatility & Competition Risk-Adjusted Sizing
        const riskFactor = Math.max(0.15, Math.min(0.5, (12 - ipo.competitorDensity) / 20));
        allocatedCapitalToman = Math.floor(currentCapitalToman * riskFactor);
      } else {
        // Fixed capital allocation
        const targetFixed = config.fixedAllocationToman || 10_000_000;
        allocatedCapitalToman = Math.min(currentCapitalToman, targetFixed);
      }

      // Respect retail order cap if lower
      if (ipo.retailQuotaToman && allocatedCapitalToman > ipo.retailQuotaToman) {
        allocatedCapitalToman = ipo.retailQuotaToman;
      }
      allocatedCapitalToman = Math.max(500_000, allocatedCapitalToman);

      const allocatedCapitalRials = allocatedCapitalToman * 10;
      const day1LimitUpPrice = Math.floor(ipo.ipoPrice * (1 + ipo.dailyLimitPercent / 100));
      const sharesRequested = Math.floor(allocatedCapitalRials / day1LimitUpPrice);

      // 2. Multi-Shot Burst Firing Simulation with OMS Layer
      let winningShotIndex = -1;
      let winningArrivalDeltaMs = 9999;
      let allShotsEarly = true;

      for (let shot = 0; shot < burstCount; shot++) {
        const dispatchOffsetMs = -effectiveLeadTimeMs + shot * burstIntervalMs;
        const transitJitterMs = this.gaussianRandom(0, net.jitterMs);
        const shotTransitMs = Math.max(0.1, baseTransitMs + transitJitterMs);

        const omsJitterMs = this.gaussianRandom(0, oms.jitterMs);
        const effectiveOmsDelayMs = Math.max(0.2, oms.baseDelayMs + omsJitterMs);

        const arrivalDeltaMs = Number(
          (dispatchOffsetMs + shotTransitMs + effectiveOmsDelayMs).toFixed(2)
        );

        if (arrivalDeltaMs >= 0) {
          allShotsEarly = false;
          winningShotIndex = shot + 1;
          winningArrivalDeltaMs = arrivalDeltaMs;
          allArrivalLatencies.push(arrivalDeltaMs);
          break; // Stop on first accepted packet (Circuit Breaker)
        }
      }

      let fillStatus: 'FILLED' | 'PARTIAL' | 'NOT_FILLED' | 'EARLY_REJECT';
      let simulatedQueueRank = 999;
      let sharesFilled = 0;
      let fillRatePercent = 0;
      let netProfitToman = 0;
      let grossProfitToman = 0;
      let commissionToman = 0;
      let tradeReturnPercent = 0;
      let exitReason = '';

      if (allShotsEarly) {
        fillStatus = 'EARLY_REJECT';
        earlyRejectionsCount++;
        simulatedQueueRank = 0;
        winningShotIndex = 1;
        exitReason = `تمامی ${burstCount} شلیک قبل از ۰۸:۴۵:۰۰ به هسته رسیدند و ریجکت شدند. (لیدتایم بیش از حد زودهنگام)`;
      } else {
        // High-Precision Order Book Depth & Position-in-Queue (PIQ)
        const densityFactor = (ipo.competitorDensity || 8) / 8;
        const normalizedSpeed = winningArrivalDeltaMs / (ipo.avgCompetitorArrivalMs || 6.5);
        const quotaBonus = oms.gatewayQuotaBonus || 0;

        const calculatedRank = Math.max(
          1,
          Math.round(Math.pow(normalizedSpeed, 1.42) * 3.8 * densityFactor) -
            quotaBonus +
            Math.floor(Math.random() * 2)
        );
        simulatedQueueRank = calculatedRank;

        // Order Book Matching vs Available Day 1 Traded Liquidity
        if (simulatedQueueRank <= ipo.maxFillableRank) {
          // 100% Full Execution
          fillStatus = 'FILLED';
          filledCount++;
          sharesFilled = sharesRequested;
          fillRatePercent = 100;

          const grossMultiplier = ipo.totalRunReturnPercent / 100;
          grossProfitToman = Math.floor(allocatedCapitalToman * grossMultiplier);
          commissionToman = Math.floor(
            allocatedCapitalToman * (1 + Math.max(0, grossMultiplier)) * TOTAL_COMMISSION_RATE
          );
          netProfitToman = grossProfitToman - commissionToman;
          tradeReturnPercent = Number(
            ((netProfitToman / allocatedCapitalToman) * 100).toFixed(1)
          );

          if (netProfitToman >= 0) {
            winningTrades++;
            consecutiveWinCurrent++;
            consecutiveLossCurrent = 0;
            if (consecutiveWinCurrent > maxConsecutiveWins) {
              maxConsecutiveWins = consecutiveWinCurrent;
            }
          } else {
            losingTrades++;
            consecutiveLossCurrent++;
            consecutiveWinCurrent = 0;
            if (consecutiveLossCurrent > maxConsecutiveLosses) {
              maxConsecutiveLosses = consecutiveLossCurrent;
            }
          }

          exitReason =
            netProfitToman >= 0
              ? `خرید ۱۰۰٪ با شلیک #${winningShotIndex} (رتبه ${simulatedQueueRank}) در صف؛ خروج سودآور در روز تعادل (${ipo.lockupDays} روز قفل)`
              : `خرید کامل با رتبه ${simulatedQueueRank}؛ فعال‌سازی حد ضرر پس از شکست صف در روز ${ipo.lockupDays}`;
        } else if (simulatedQueueRank <= Math.round(ipo.maxFillableRank * 2.3)) {
          // Partial Fill based on liquidity tapering
          fillStatus = 'PARTIAL';
          partialCount++;

          const fillRatio = Math.max(
            0.15,
            Math.min(
              0.85,
              1 -
                (simulatedQueueRank - ipo.maxFillableRank) /
                  (ipo.maxFillableRank * 1.6 + 0.1)
            )
          );
          fillRatePercent = Math.round(fillRatio * 100);
          sharesFilled = Math.floor(sharesRequested * fillRatio);
          const effectiveCapitalToman = Math.floor(allocatedCapitalToman * fillRatio);

          const grossMultiplier = ipo.totalRunReturnPercent / 100;
          grossProfitToman = Math.floor(effectiveCapitalToman * grossMultiplier);
          commissionToman = Math.floor(
            effectiveCapitalToman * (1 + Math.max(0, grossMultiplier)) * TOTAL_COMMISSION_RATE
          );
          netProfitToman = grossProfitToman - commissionToman;
          tradeReturnPercent = Number(
            ((netProfitToman / effectiveCapitalToman) * 100).toFixed(1)
          );

          if (netProfitToman >= 0) {
            winningTrades++;
            consecutiveWinCurrent++;
            consecutiveLossCurrent = 0;
            if (consecutiveWinCurrent > maxConsecutiveWins) {
              maxConsecutiveWins = consecutiveWinCurrent;
            }
          } else {
            losingTrades++;
            consecutiveLossCurrent++;
            consecutiveWinCurrent = 0;
            if (consecutiveLossCurrent > maxConsecutiveLosses) {
              maxConsecutiveLosses = consecutiveLossCurrent;
            }
          }

          exitReason = `تخصیص حجم جزئی (${fillRatePercent}٪ سفارش) با شلیک #${winningShotIndex} (رتبه ${simulatedQueueRank})؛ مازاد نقدینگی برگردانده شد`;
        } else {
          // Unfilled - Queue did not reach this rank
          fillStatus = 'NOT_FILLED';
          missedCount++;
          fillRatePercent = 0;
          sharesFilled = 0;
          exitReason = `نوبت به سفارش نرسید (شلیک #${winningShotIndex} با تاخیر +${winningArrivalDeltaMs}ms در رتبه ${simulatedQueueRank} صف قرار گرفت)`;
        }
      }

      // Update Equity & Drawdown
      currentCapitalToman += netProfitToman;
      if (currentCapitalToman > peakCapitalToman) {
        peakCapitalToman = currentCapitalToman;
        currentDdDuration = 0;
      } else {
        currentDdDuration += ipo.lockupDays;
        if (currentDdDuration > maxDdDuration) {
          maxDdDuration = currentDdDuration;
        }
      }

      const currentDd = ((peakCapitalToman - currentCapitalToman) / peakCapitalToman) * 100;
      if (currentDd > maxDrawdownPercent) {
        maxDrawdownPercent = currentDd;
      }

      equityCurve.push({
        tradeIndex: idx + 1,
        date: ipo.listingDate,
        symbol: ipo.symbol,
        portfolioValueToman: currentCapitalToman,
        drawdownPercent: Number(currentDd.toFixed(2)),
      });

      trades.push({
        symbol: ipo.symbol,
        name: ipo.name,
        sector: ipo.sector,
        listingDate: ipo.listingDate,
        ipoPrice: ipo.ipoPrice,
        allocatedCapitalToman,
        sharesRequested,
        sharesFilled,
        winningShotIndex,
        arrivalDeltaMs: winningArrivalDeltaMs === 9999 ? 0 : winningArrivalDeltaMs,
        simulatedQueueRank,
        fillStatus,
        fillRatePercent,
        grossProfitToman,
        commissionToman,
        netProfitToman,
        tradeReturnPercent,
        lockupDays: ipo.lockupDays,
        exitReason,
      });
    });

    const totalNetProfitToman = currentCapitalToman - config.initialCapitalToman;
    const portfolioTotalReturnPercent = Number(
      ((totalNetProfitToman / config.initialCapitalToman) * 100).toFixed(1)
    );
    const fillSuccessRatePercent = Number(
      (((filledCount + partialCount) / ipos.length) * 100).toFixed(1)
    );
    const totalExecuted = filledCount + partialCount;
    const winRatePercent = Number(
      ((winningTrades / Math.max(1, totalExecuted)) * 100).toFixed(1)
    );
    const lossRatePercent = Number(
      ((losingTrades / Math.max(1, totalExecuted)) * 100).toFixed(1)
    );

    const executedTrades = trades.filter(
      (t) => t.fillStatus === 'FILLED' || t.fillStatus === 'PARTIAL'
    );

    const winningList = executedTrades.filter((t) => t.netProfitToman > 0);
    const losingList = executedTrades.filter((t) => t.netProfitToman < 0);

    const avgWinReturn =
      winningList.length > 0
        ? winningList.reduce((acc, t) => acc + t.tradeReturnPercent, 0) / winningList.length
        : 0;

    const avgLossReturn =
      losingList.length > 0
        ? losingList.reduce((acc, t) => acc + t.tradeReturnPercent, 0) / losingList.length
        : 0;

    const avgTradeReturn =
      executedTrades.length > 0
        ? executedTrades.reduce((acc, t) => acc + t.tradeReturnPercent, 0) /
          executedTrades.length
        : 0;

    const totalGains = executedTrades.reduce(
      (acc, t) => acc + Math.max(0, t.netProfitToman),
      0
    );
    const totalLosses = Math.abs(
      executedTrades.reduce((acc, t) => acc + Math.min(0, t.netProfitToman), 0)
    );
    const profitFactor =
      totalLosses === 0
        ? totalGains > 0
          ? 99.9
          : 1.0
        : Number((totalGains / totalLosses).toFixed(2));

    const avgWinAmount = winningList.length > 0 ? totalGains / winningList.length : 0;
    const avgLossAmount = losingList.length > 0 ? totalLosses / losingList.length : 1;
    const payoffRatio = Number((avgWinAmount / Math.max(1, avgLossAmount)).toFixed(2));

    const expectancyToman =
      executedTrades.length > 0
        ? Math.round(
            (winRatePercent / 100) * avgWinAmount -
              (lossRatePercent / 100) * avgLossAmount
          )
        : 0;
    const expectancyPercent = Number(
      (
        (winRatePercent / 100) * avgWinReturn -
        (lossRatePercent / 100) * Math.abs(avgLossReturn)
      ).toFixed(2)
    );

    // Modern Portfolio Risk Calculations: Sharpe, Sortino, Calmar, VaR
    // Risk-free rate in Iran ~ 30% annually, roughly 0.12% per trading session
    const RISK_FREE_PER_TRADE = 0.12;

    const returnsArray = executedTrades.map((t) => t.tradeReturnPercent);
    const meanReturn = returnsArray.length > 0 ? avgTradeReturn : 0;
    const variance =
      returnsArray.length > 1
        ? returnsArray.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) /
          (returnsArray.length - 1)
        : 1;
    const stdev = Math.sqrt(variance);

    // Downside deviation for Sortino
    const downsideReturns = returnsArray.filter((r) => r < RISK_FREE_PER_TRADE);
    const downsideVariance =
      downsideReturns.length > 1
        ? downsideReturns.reduce(
            (acc, r) => acc + Math.pow(r - RISK_FREE_PER_TRADE, 2),
            0
          ) / downsideReturns.length
        : 0.5;
    const downsideStdev = Math.max(0.1, Math.sqrt(downsideVariance));

    // Annualized Sharpe & Sortino (assuming ~240 trading sessions/year)
    const annualFactor = Math.sqrt(Math.min(240, Math.max(12, ipos.length)));
    const sharpeRatio =
      stdev > 0
        ? Number((((meanReturn - RISK_FREE_PER_TRADE) / stdev) * annualFactor).toFixed(2))
        : 0;
    const sortinoRatio = Number(
      (((meanReturn - RISK_FREE_PER_TRADE) / downsideStdev) * annualFactor).toFixed(2)
    );

    // Calmar Ratio: Annual Return / Max Drawdown
    const calmarRatio =
      maxDrawdownPercent > 0
        ? Number((portfolioTotalReturnPercent / maxDrawdownPercent).toFixed(2))
        : portfolioTotalReturnPercent > 0
        ? 99.9
        : 0;

    // Value at Risk (Historical VaR 95% and 99%)
    const sortedReturns = [...returnsArray].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var99Index = Math.floor(sortedReturns.length * 0.01);
    const valueAtRisk95Percent =
      sortedReturns.length > 0 ? Number(Math.abs(sortedReturns[var95Index] || 0).toFixed(2)) : 0;
    const valueAtRisk99Percent =
      sortedReturns.length > 0 ? Number(Math.abs(sortedReturns[var99Index] || 0).toFixed(2)) : 0;

    // Latency Percentiles
    allArrivalLatencies.sort((a, b) => a - b);
    const p50 = allArrivalLatencies[Math.floor(allArrivalLatencies.length * 0.5)] || 0;
    const p90 = allArrivalLatencies[Math.floor(allArrivalLatencies.length * 0.9)] || 0;
    const p95 = allArrivalLatencies[Math.floor(allArrivalLatencies.length * 0.95)] || 0;
    const p99 = allArrivalLatencies[Math.floor(allArrivalLatencies.length * 0.99)] || 0;
    const minLat = allArrivalLatencies[0] || 0;
    const maxLat = allArrivalLatencies[allArrivalLatencies.length - 1] || 0;

    // Optional Monte Carlo multi-path run
    let monteCarlo: MonteCarloAnalysis | undefined;
    if (config.includeMonteCarlo) {
      monteCarlo = this.runMonteCarlo(config, config.monteCarloIterations || 150);
    }

    return {
      summary: {
        initialCapitalToman: config.initialCapitalToman,
        endingCapitalToman: currentCapitalToman,
        totalNetProfitToman,
        portfolioTotalReturnPercent,
        totalOpportunities: ipos.length,
        filledTradesCount: filledCount,
        partialTradesCount: partialCount,
        missedTradesCount: missedCount,
        earlyRejectionsCount,
        fillSuccessRatePercent,
        winRatePercent,
        lossRatePercent,
        averageReturnPerTradePercent: Number(avgTradeReturn.toFixed(1)),
        averageWinReturnPercent: Number(avgWinReturn.toFixed(1)),
        averageLossReturnPercent: Number(avgLossReturn.toFixed(1)),
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(1)),
        maxDrawdownDurationDays: maxDdDuration,
        profitFactor,
        expectancyToman,
        expectancyPercent,
        payoffRatio,
        consecutiveWins: maxConsecutiveWins,
        consecutiveLosses: maxConsecutiveLosses,
        valueAtRisk95Percent,
        valueAtRisk99Percent,
        connectionType: config.connectionType,
        brokerOMS: oms.name,
        leadTimeMs: effectiveLeadTimeMs,
        burstCount,
        burstIntervalMs,
        latencyStats: {
          p50Ms: Number(p50.toFixed(2)),
          p90Ms: Number(p90.toFixed(2)),
          p95Ms: Number(p95.toFixed(2)),
          p99Ms: Number(p99.toFixed(2)),
          minMs: Number(minLat.toFixed(2)),
          maxMs: Number(maxLat.toFixed(2)),
        },
      },
      equityCurve,
      trades,
      monteCarlo,
    };
  }

  /**
   * Monte Carlo Stochastic Multi-Path Simulation
   */
  public static runMonteCarlo(
    baseConfig: HistoricalBacktestConfig,
    iterations = 150
  ): MonteCarloAnalysis {
    const finalReturns: number[] = [];
    const maxDrawdowns: number[] = [];
    const allPaths: number[][] = [];

    const simConfig: HistoricalBacktestConfig = {
      ...baseConfig,
      includeMonteCarlo: false,
    };

    for (let i = 0; i < iterations; i++) {
      const rep = this.runBacktest(simConfig);
      finalReturns.push(rep.summary.portfolioTotalReturnPercent);
      maxDrawdowns.push(rep.summary.maxDrawdownPercent);

      const pathValues = rep.equityCurve.map((p) => p.portfolioValueToman);
      allPaths.push(pathValues);
    }

    finalReturns.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const medianReturn = finalReturns[Math.floor(finalReturns.length * 0.5)];
    const p5Return = finalReturns[Math.floor(finalReturns.length * 0.05)];
    const p95Return = finalReturns[Math.floor(finalReturns.length * 0.95)];
    const positiveReturns = finalReturns.filter((r) => r > 0).length;
    const probProfit = Number(((positiveReturns / iterations) * 100).toFixed(1));
    const mdd95 = maxDrawdowns[Math.floor(maxDrawdowns.length * 0.95)];

    // Select 5 representative sample paths for chart visual confidence bands
    // 0: Worst, 1: 25th percentile, 2: Median, 3: 75th percentile, 4: Best
    const sortedIndices = allPaths
      .map((p, idx) => ({ idx, finalVal: p[p.length - 1] }))
      .sort((a, b) => a.finalVal - b.finalVal);

    const samplePaths = [
      {
        name: 'بدبینانه‌ترین حالت (Worst 5%)',
        finalReturnPercent: p5Return,
        path: allPaths[sortedIndices[Math.floor(iterations * 0.05)].idx],
      },
      {
        name: 'سناریوی میانه (Expected Median)',
        finalReturnPercent: medianReturn,
        path: allPaths[sortedIndices[Math.floor(iterations * 0.5)].idx],
      },
      {
        name: 'خوش‌بینانه‌ترین حالت (Best 95%)',
        finalReturnPercent: p95Return,
        path: allPaths[sortedIndices[Math.floor(iterations * 0.95)].idx],
      },
    ];

    return {
      iterations,
      medianReturnPercent: Number(medianReturn.toFixed(1)),
      percentile5ReturnPercent: Number(p5Return.toFixed(1)),
      percentile95ReturnPercent: Number(p95Return.toFixed(1)),
      probabilityOfProfitPercent: probProfit,
      monteCarloDrawdown95Percent: Number(mdd95.toFixed(1)),
      samplePaths,
    };
  }
}
