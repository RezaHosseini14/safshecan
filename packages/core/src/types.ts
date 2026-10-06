/**
 * Core domain types for SafShekan (صف‌شکن) TSE High-Speed Trading Engine
 */

export type SniperState = 'IDLE' | 'ARMED' | 'PRE_WARMING' | 'FIRING' | 'COMPLETED' | 'CANCELLED' | 'ERROR';

export type BrokerType = 'curl' | 'tadbir' | 'rayan' | 'mofid' | 'agah' | 'farabi' | 'farabixo' | 'sahra' | 'easytrader' | 'custom';

export interface OrderConfig {
  symbol: string;             // نماد سهم (مثلاً: شستا، فزر، پی‌پاد)
  price: number;              // سقف قیمت مجاز (قیمت سرخطی)
  quantity: number;           // حجم سفارش (تعداد سهام)
  side: 'BUY' | 'SELL';       // سمت معامله (خرید / فروش)
  brokerType: BrokerType;     // شناسه کارگزاری
  isin?: string;              // کد بین‌المللی نماد
  antiDoubleSpend?: boolean;  // جلوگیری از ثبت سفارش تکراری در صورت موفقیت
}

export interface NetworkConfig {
  targetUrl: string;
  method: 'POST' | 'GET' | 'PUT' | string;
  headers: Record<string, string>;
  bodyTemplate?: string;      // Template with placeholders
  body?: string;              // Stringified JSON payload
  cookies?: string;
  maxSockets?: number;
  timeoutMs?: number;
}

export interface SniperTimingConfig {
  targetTime: string;         // فرمت: "08:45:00.000" یا "08:30:00.000"
  leadTimeMs: number;         // جبران پینگ شبکه (Offset) بر حسب میلی‌ثانیه
  burstCount: number;         // تعداد سفارشات رگباری (مثلاً 5 تا 15 شلیک)
  burstIntervalMs: number;    // فاصله زمانی بین هر شلیک (مثلاً 2.5ms تا 40ms)
  preWarmSeconds?: number;    // زمان پیش‌گرم سوکت بر حسب ثانیه
  preWarmTimeMs?: number;     // زمان پیش‌گرم سوکت بر حسب میلی‌ثانیه
  stopOnFirstSuccess?: boolean;// توقف رگبار با اولین سفارش موفق
  ntpSyncIntervalMs?: number; // فاصله بررسی همگام‌سازی ساعت با سرور NTP
}

export type TimingConfig = SniperTimingConfig;

export interface AccountInfo {
  customerTitle?: string;
  customerCode?: string;
  customerId?: string;
  brokerName?: string;
  title?: string;
  balanceToman?: number;
  tokenExpiresAt?: string;
  minutesLeft?: number;
  isTokenExpired?: boolean;
  authType?: 'BEARER_JWT' | 'SESSION_COOKIE' | 'BASIC' | 'NONE';
}

export interface BotConfig {
  order: OrderConfig;
  network: NetworkConfig;
  timing: SniperTimingConfig;
  account?: AccountInfo;
  serverPort?: number;
  autoOpenBrowser?: boolean;
  soundAlertEnabled?: boolean;
  ntpServers?: string[];
}

export interface TimeSyncStatus {
  lastSyncTime?: Date | string | null;
  offsetMs: number;           // اختلاف ساعت سیستم با سرور مرجع
  rttMs: number;              // پینگ / زمان رفت و برگشت پکت
  source: string;             // نام سرور مرجع (ir.pool.ntp.org یا tsetmc.com)
  synchronized: boolean;
}

export interface OrderShotResult {
  shotIndex: number;
  timestamp: string | number;
  scheduledTime?: number;
  firedAt?: number;
  responseTimestamp?: string;
  latencyMs: number;
  httpStatus: number;
  success: boolean;
  trackingCode?: string;
  rawResponse?: any;
  errorMessage?: string;
  headers?: Record<string, string>;
  symbol?: string;
  broker?: string;
  rawRequestPayload?: string;
  rawResponsePayload?: string;
}

export type ShotResult = OrderShotResult;

export interface ServerBroadcastMessage {
  type: 'CLOCK_TICK' | 'STATE_CHANGE' | 'TIME_SYNC' | 'SHOT_LOG' | 'ORDER_SHOT' | 'SNIPER_SUMMARY';
  data: any;
}

export type WebSocketMessage = ServerBroadcastMessage;

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'success' | 'error';
  text: string;
  shot?: OrderShotResult;
}

export interface SymbolItem {
  symbol: string;
  name: string;
  group?: string;
  isin: string;
  market?: string;
  price?: number;
  yesterdayPrice?: number;
  high?: number;
  low?: number;
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
  results: OrderShotResult[];
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
  market: string;
  supplyDate: string;
  offeringPriceToman: number;
  firstDayCloseReturnPercent: number;
  lockLimitUpDays: number;
  totalReturnPercent: number;
  averageWaitTimeMinutes: number;
  totalAllottedRials: number;
}

export interface BacktestReport {
  summary: {
    totalRuns: number;
    successRate: number;
    avgLatencyMs: number;
    bestRankEstimate: number;
    worstRankEstimate: number;
    avgRankEstimate: number;
  };
  runs: Array<{
    runIndex: number;
    targetTime: string;
    shotsFired: number;
    bestLatencyMs: number;
    estimatedQueuePosition: number;
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  }>;
}

export interface HistoricalBacktestReport {
  config: {
    initialCapitalToman: number;
    allocationMode: 'fixed' | 'percent';
    positionSizingPercent: number;
    fixedAllocationToman: number;
    connectionType: string;
    leadTimeMs?: number;
  };
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
  trades: Array<{
    symbol: string;
    supplyDate: string;
    allocated: boolean;
    queueRank: number;
    investedToman: number;
    profitToman: number;
    returnPercent: number;
    exitReason: string;
  }>;
}
