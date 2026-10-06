import { NetworkConfig, OrderConfig } from '../types/index.js';

export interface BrokerPreset {
  id: string;
  name: string;
  description: string;
  sampleUrl: string;
  defaultHeaders: Record<string, string>;
  defaultBody: string;
  notes: string;
}

export const BROKER_PRESETS: BrokerPreset[] = [
  {
    id: 'tadbir',
    name: 'سامانه تدبیر پرداز (آنلاین پلاس)',
    description: 'مورد استفاده در ده‌ها کارگزاری مانند مفید (قدیم)، پاسارگاد، خوارزمی، مبین، سامان و...',
    sampleUrl: 'https://onlineplus.examplebroker.ir/api/Order/SendOrder',
    defaultHeaders: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    defaultBody: JSON.stringify(
      {
        Isin: 'IRO1...',
        OrderSide: 1, // 1 = خرید (Buy), 2 = فروش (Sell)
        OrderPrice: '{{price}}',
        OrderQuantity: '{{quantity}}',
        OrderValidity: 1, // 1 = روز (Day)
        FinancialProviderId: 1,
      },
      null,
      2
    ),
    notes: 'کافی است یک بار درخواست SendOrder را در کنسول بازرسی کپی کنید یا توکن خود را در هدر Authorization وارد نمایید.',
  },
  {
    id: 'easytrader',
    name: 'ایزی‌تریدر کارگزاری مفید (EasyTrader)',
    description: 'سامانه مدرن کارگزاری مفید تحت وب',
    sampleUrl: 'https://api.easytrader.emofid.com/core/api/v1/orders',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    defaultBody: JSON.stringify(
      {
        isin: 'IRO1...',
        side: 1,
        price: '{{price}}',
        quantity: '{{quantity}}',
        validityType: 1,
      },
      null,
      2
    ),
    notes: 'توکن دسترسی را از هدر Authorization درخواست‌های تب Network استخراج و وارد کنید.',
  },
  {
    id: 'rayan',
    name: 'سامانه رایان بورس',
    description: 'سامانه آنلاین کارگزاری‌های مبتنی بر موتور رایان بورس',
    sampleUrl: 'https://online.examplebroker.ir/CustomerOrder/SendOrder',
    defaultHeaders: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    defaultBody: JSON.stringify(
      {
        InstrumentId: 'IRO1...',
        Side: 1,
        Price: '{{price}}',
        Quantity: '{{quantity}}',
        ValidityType: 1,
      },
      null,
      2
    ),
    notes: 'کوکی‌ها (ASP.NET_SessionId) نقش حیاتی در احراز هویت رایان بورس دارند.',
  },
  {
    id: 'custom',
    name: 'کاستوم / وارد کردن دستور cURL (پیشنهادی)',
    description: 'پشتیبانی ۱۰۰٪ از هر نوع کارگزاری با کپی مستقیم cURL از DevTools مرورگر',
    sampleUrl: 'https://broker.ir/api/order',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    defaultBody: JSON.stringify(
      {
        symbol: '{{symbol}}',
        price: '{{price}}',
        quantity: '{{quantity}}',
      },
      null,
      2
    ),
    notes: 'بهترین و مطمئن‌ترین روش؛ کافی است دستور cURL سفارش را در مرورگر کپی و در فرم زیر پیست نمایید.',
  },
];
