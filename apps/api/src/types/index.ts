export interface OrderConfig {
  symbol: string;             // نماد سهم (مثلاً: شستا، فزر، پی‌پاد)
  price: number;              // سقف قیمت مجاز (قیمت سرخطی)
  quantity: number;           // حجم سفارش (تعداد سهام)
  side: 'BUY' | 'SELL';       // سمت معامله (خرید / فروش - معمولاً BUY برای عرضه اولیه)
  brokerType: 'curl' | 'tadbir' | 'rayan' | 'easytrader' | 'farabi' | 'sahra' | 'custom';
  isin?: string;
  antiDoubleSpend?: boolean;
}

export interface NetworkConfig {
  targetUrl: string;
  method: 'POST' | 'GET' | 'PUT';
  headers: Record<string, string>;
  bodyTemplate: string;       // JSON stringified with possible {{symbol}}, {{price}}, {{quantity}} placeholders
  cookies?: string;
}

export interface SniperTimingConfig {
  targetTime: string;         // فرمت: "08:45:00.000" یا "08:30:00.000"
  leadTimeMs: number;         // جبران پینگ شبکه (Offset) بر حسب میلی‌ثانیه (مثلاً 15 برای ارسال 15ms زودتر)
  burstCount: number;         // تعداد سفارشات رگباری (مثلاً 8 تا 15 شلیک)
  burstIntervalMs: number;    // فاصله زمانی بین هر شلیک (مثلاً 40ms یا 50ms)
  preWarmSeconds: number;     // چند ثانیه قبل از ساعت هدف سوکت و SSL پیش‌گرم شود (مثلاً 12 ثانیه)
  stopOnFirstSuccess: boolean;// آیا با ثبت اولین سفارش موفق، بقیه شلیک‌ها متوقف شوند؟
}

export interface AccountInfo {
  customerTitle?: string;     // نام و نام خانوادگی مشتری (استخراج از توکن یا بدنه)
  customerCode?: string;      // کد ملی، کد مشتری یا شناسه حساب
  brokerName?: string;        // نام کارگزاری شناسایی شده (مثلاً مفید، پاسارگاد، تدبیر)
  tokenExpiresAt?: string;    // زمان انقضای توکن به ساعت
  minutesLeft?: number;       // دقایق باقی‌مانده تا انقضای توکن
  isTokenExpired?: boolean;   // آیا توکن منقضی شده؟
  authType?: 'BEARER_JWT' | 'SESSION_COOKIE' | 'BASIC' | 'NONE';
}

export interface BotConfig {
  order: OrderConfig;
  network: NetworkConfig;
  timing: SniperTimingConfig;
  account?: AccountInfo;
  serverPort: number;
  autoOpenBrowser: boolean;
  soundAlertEnabled: boolean;
  ntpServers: string[];
}

export interface TimeSyncStatus {
  lastSyncTime: Date | null;
  offsetMs: number;           // اختلاف ساعت سیستم با سرور مرجع (سیستم منهای سرور مرجع)
  rttMs: number;              // پینگ / زمان رفت و برگشت پکت
  source: string;             // نام سرور مرجع (مثلاً ir.pool.ntp.org یا tsetmc.com)
  synchronized: boolean;
}

export type SniperState = 'IDLE' | 'ARMED' | 'PRE_WARMING' | 'FIRING' | 'COMPLETED' | 'CANCELLED';

export interface OrderShotResult {
  shotIndex: number;
  timestamp: string;          // زمان دقیق میلی‌ثانیه‌ای ارسال
  responseTimestamp: string;  // زمان دریافت پاسخ
  latencyMs: number;          // تاخیر پاسخگویی کارگزاری
  httpStatus: number;
  success: boolean;
  trackingCode?: string;      // کد رهگیری سفارش در صورت دریافت
  rawResponse: string;        // متن پاسخ دریافتی از سرور کارگزاری
  errorMessage?: string;
}

export interface ServerBroadcastMessage {
  type: 'CLOCK_TICK' | 'STATE_CHANGE' | 'TIME_SYNC' | 'SHOT_LOG' | 'ORDER_SHOT' | 'SNIPER_SUMMARY';
  data: any;
}
