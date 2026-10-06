export type SniperState = 'IDLE' | 'ARMED' | 'PRE_WARMING' | 'FIRING' | 'COMPLETED' | 'ERROR';

export type BrokerType = 'tadbir' | 'mofid' | 'agah' | 'farabixo' | 'sahra' | 'custom';

export interface TimingConfig {
  targetTime: string;          // e.g. "08:45:00.000"
  leadTimeMs: number;          // e.g. 18
  burstCount: number;          // e.g. 5
  burstIntervalMs: number;      // e.g. 2.5
  preWarmTimeMs: number;       // e.g. 1500
  ntpSyncIntervalMs: number;   // e.g. 60000
}

export interface OrderConfig {
  symbol: string;              // e.g. "فزر"
  price: number;               // e.g. 25000
  quantity: number;            // e.g. 500
  brokerType: BrokerType;
  isin?: string;
  side: 'BUY' | 'SELL';
  antiDoubleSpend?: boolean;
}

export interface NetworkConfig {
  targetUrl: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  maxSockets: number;
  timeoutMs: number;
}

export interface AccountInfo {
  customerId?: string;
  brokerName?: string;
  title?: string;
  balanceToman?: number;
}

export interface BotConfig {
  timing: TimingConfig;
  order: OrderConfig;
  network: NetworkConfig;
  account?: AccountInfo;
  serverPort?: number;
  autoOpenBrowser?: boolean;
}

export interface TimeSyncStatus {
  synchronized: boolean;
  offsetMs: number;
  rttMs: number;
  source: string;
  lastSyncTime?: string;
}

export interface ShotResult {
  shotIndex: number;
  timestamp: string | number;
  scheduledTime?: number;
  firedAt?: number;
  latencyMs: number;
  httpStatus: number;
  success: boolean;
  trackingCode?: string;
  errorMessage?: string;
  rawResponse?: any;
  headers?: Record<string, string>;
  symbol?: string;
  broker?: string;
  rawRequestPayload?: string;
  rawResponsePayload?: string;
}

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'success' | 'error';
  text: string;
  shot?: ShotResult;
}

export interface IPODetails {
  title: string;
  description: string;
  dateStr?: string;
  timeStr?: string;
  stage?: string;
  status: 'UPCOMING' | 'ACTIVE_TODAY' | 'RECENT';
  source?: 'SUPERVISOR_MSG' | 'HISTORICAL_DATABASE';
  announcedAt?: string;
}

export interface SymbolItem {
  symbol: string;
  name: string;
  group?: string;
  isin: string;
  market?: string;
  basePrice?: number;
  price?: number;
  closingPrice?: number;
  yesterdayPrice?: number;
  high?: number;
  low?: number;
  highPrice?: number;
  lowPrice?: number;
  pMax?: number; // سقف قیمت مجاز
  pMin?: number; // کف قیمت مجاز
  baseVolume?: number;
  volume?: number;
  tradesCount?: number;
  value?: number;
  eps?: number;
  pe?: string | number | null;
  isIpo?: boolean;
  ipoDetails?: IPODetails;
  lastUpdated?: string;
}

export interface SymbolsSyncStatus {
  totalSymbols: number;
  ipoCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
  lastError: string | null;
}

export interface SymbolsRefreshResult {
  success: boolean;
  totalSymbols: number;
  ipoCount: number;
  newIpos: string[];
  message: string;
}

export interface BrokerPreset {
  id: BrokerType;
  name: string;
  description: string;
  defaultUrl: string;
  sampleHeaders: Record<string, string>;
}

export interface ServerStatusResponse {
  config: BotConfig;
  state: SniperState;
  timeSync: TimeSyncStatus;
  results: ShotResult[];
  presets: BrokerPreset[];
}

export interface ParsedCurlResult {
  network: {
    targetUrl: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  };
  broker: {
    id: string;
    name: string;
    detected: boolean;
  };
  account: {
    customerId?: string;
    brokerName?: string;
    title?: string;
  };
  extractedOrder: {
    symbol?: string;
    price?: number;
    quantity?: number;
    side?: 'BUY' | 'SELL';
    isin?: string;
  };
}

export interface HistoricalIPO {
  symbol: string;
  name: string;
  sector: string;
  market: string;
  listingDate: string;
  ipoPrice: number;
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

export interface TestedLeadTime {
  leadTimeMs: number;
  totalRuns: number;
  rank1To5Count: number;
  rank6To25Count: number;
  rank26To100Count: number;
  earlyRejectionCount: number;
  rateLimitedCount: number;
  bestRankAchieved: number;
  topRankSuccessRate: number;
  totalSuccessRate: number;
  avgLatencyMs: number;
}

export interface ScenarioResult {
  scenarioName: string;
  pingMs: number;
  jitterMs: number;
  testedLeadTimes: TestedLeadTime[];
  recommendedLeadTimeMs: number;
  recommendationReason: string;
}

export interface OpeningRunDetail {
  runIndex: number;
  targetTime: string;
  shotsFired: number;
  bestLatencyMs: number;
  estimatedQueuePosition: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'REJECTED_EARLY';
  ispTransitMs: number;
  omsProcessingMs: number;
  packetSummary: string;
}

export interface BacktestReport {
  timestamp: string;
  summary: {
    totalRuns: number;
    successRate: number;
    avgLatencyMs: number;
    bestRankEstimate: number;
    worstRankEstimate: number;
    avgRankEstimate: number;
    goldenRankRatePercent: number;
    earlyRejectRatePercent: number;
  };
  runs: OpeningRunDetail[];
  enginePrecisionTest: {
    samples: number;
    averageErrorMs: number;
    maxJitterMs: number;
    passed: boolean;
  };
  circuitBreakerTest: {
    totalConfiguredBurst: number;
    actualDispatchedShots: number;
    haltedImmediately: boolean;
    passed: boolean;
  };
  rateLimitSafetyTest: {
    burstIntervalMs: number;
    received429Count: number;
    passed: boolean;
  };
  scenarios: ScenarioResult[];
  overallVerdict: 'PERFECT_SNIPER' | 'ACCEPTABLE' | 'NEEDS_CALIBRATION';
}

export interface HistoricalTradeResult {
  symbol: string;
  name: string;
  sector: string;
  listingDate: string;
  supplyDate?: string;
  ipoPrice: number;
  allocatedCapitalToman: number;
  investedToman?: number;
  sharesRequested: number;
  sharesFilled: number;
  winningShotIndex: number;
  arrivalDeltaMs: number;
  simulatedQueueRank: number;
  queueRank?: number;
  fillStatus: 'FILLED' | 'PARTIAL' | 'NOT_FILLED' | 'EARLY_REJECT';
  fillRatePercent: number;
  grossProfitToman: number;
  commissionToman: number;
  netProfitToman: number;
  profitToman?: number;
  tradeReturnPercent: number;
  returnPercent?: number;
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
  performance: {
    initialCapitalToman: number;
    finalCapitalToman: number;
    totalProfitToman: number;
    netReturnPercent: number;
    totalIposParticipated: number;
    successfulAllocations: number;
    allocationRatePercent: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
  };
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
  equityCurve?: EquityCurvePoint[];
  trades: HistoricalTradeResult[];
  monteCarlo?: MonteCarloAnalysis;
}

export interface WebSocketMessage {
  type: 'STATE_CHANGE' | 'CLOCK_TICK' | 'ORDER_SHOT' | 'SHOT_LOG' | 'SNIPER_SUMMARY' | 'TIME_SYNC';
  data: any;
}
