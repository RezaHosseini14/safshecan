/**
 * Constants and market rules for Tehran Stock Exchange (TSE)
 */
import { t } from '@saf-shekan/i18n';

export const TSE_HOURS = {
  PRE_OPENING_START: '08:45:00.000',
  PRE_OPENING_END: '08:59:59.999',
  OPENING_BELL: '09:00:00.000',
  MARKET_CLOSE: '12:30:00.000',
  FUTURE_AFTERNOON_OPENING: '13:00:00.000',
} as const;

export const DEFAULT_NTP_SERVERS = [
  'ir.pool.ntp.org',
  'time.nist.gov',
  'pool.ntp.org',
  'time.google.com',
  'time.windows.com',
];

export const TSE_FEE_RATES = {
  // کارمزد و مالیات معاملات سهام بورس تهران
  BOURSE: {
    BUY_BROKER: 0.003712,      // کارمزد خرید (کارگزاری + سازمان + بورس + سپرده‌گذاری + رایان)
    SELL_BROKER: 0.003712,     // کارمزد فروش
    SELL_TAX: 0.005,           // مالیات مقطوع فروش (۰.۵ درصد)
    TOTAL_BUY: 0.003712,
    TOTAL_SELL: 0.008712,      // مجموع کارمزد و مالیات فروش: ۰.۸۷۱۲ درصد
    ROUND_TRIP_TOTAL: 0.012424,// مجموع خرید و فروش: حدود ۱.۲۴ درصد
  },
  // فرابورس
  FARABOURSE: {
    BUY_BROKER: 0.003632,
    SELL_BROKER: 0.003632,
    SELL_TAX: 0.005,
    TOTAL_BUY: 0.003632,
    TOTAL_SELL: 0.008632,
    ROUND_TRIP_TOTAL: 0.012264,
  }
} as const;

export const DEFAULT_BROKER_PRESETS = [
  {
    id: 'tadbir' as const,
    name: t('brokers', 'core.tadbir.name'),
    description: t('brokers', 'core.tadbir.description'),
    defaultUrl: 'https://api.tadbirrlc.com/order/send',
    sampleHeaders: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': 'Bearer YOUR_TADBIR_TOKEN_HERE',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  },
  {
    id: 'mofid' as const,
    name: t('brokers', 'core.mofid.name'),
    description: t('brokers', 'core.mofid.description'),
    defaultUrl: 'https://core.easytrader.emofid.com/api/v1/orders',
    sampleHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_MOFID_TOKEN',
      'X-App-Version': '3.2.0',
    },
  },
  {
    id: 'agah' as const,
    name: t('brokers', 'core.agah.name'),
    description: t('brokers', 'core.agah.description'),
    defaultUrl: 'https://online.agah.com/api/order/place',
    sampleHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AGAH_TOKEN',
    },
  },
  {
    id: 'farabixo' as const,
    name: t('brokers', 'core.farabixo.name'),
    description: t('brokers', 'core.farabixo.description'),
    defaultUrl: 'https://next.farabixo.com/api/v1/orders/send',
    sampleHeaders: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_FARABI_TOKEN',
    },
  },
  {
    id: 'sahra' as const,
    name: t('brokers', 'core.sahra.name'),
    description: t('brokers', 'core.sahra.description'),
    defaultUrl: 'https://online.sahra.ir/api/Order/SendOrder',
    sampleHeaders: {
      'Content-Type': 'application/json',
      'Cookie': 'ASP.NET_SessionId=YOUR_SESSION_ID',
    },
  },
  {
    id: 'custom' as const,
    name: t('brokers', 'core.custom.name'),
    description: t('brokers', 'core.custom.description'),
    defaultUrl: 'https://broker-domain.ir/api/order',
    sampleHeaders: {
      'Content-Type': 'application/json',
    },
  },
];
