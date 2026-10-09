import { NetworkConfig } from '@saf-shekan/core';

export interface BrokerPreset {
  id: string;
  name: string;
  description: string;
  sampleUrl: string;
  defaultHeaders: Record<string, string>;
  defaultBody: string;
  notes: string;
}

/** Legacy / curl-parser ids → canonical frontend BrokerType ids */
export const BROKER_PRESET_ALIASES: Record<string, string> = {
  easytrader: 'mofid',
  rayan: 'agah',
  farabi: 'farabixo',
  asa: 'agah',
  curl: 'custom',
};

export function resolveBrokerPresetId(presetId: string): string {
  return BROKER_PRESET_ALIASES[presetId] || presetId;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

export const BROKER_PRESETS: BrokerPreset[] = [
  {
    id: 'tadbir',
    name: 'سامانه تدبیرپرداز (آنلاین‌پلاس)',
    description: 'سامان، فارابی، خوارزمی، مبین و ده‌ها کارگزاری مبتنی بر OnlinePlus',
    sampleUrl: 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder',
    defaultHeaders: {
      ...JSON_HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
    },
    defaultBody: JSON.stringify(
      {
        Isin: '{{isin}}',
        OrderSide: 1,
        OrderPrice: '{{price}}',
        OrderQuantity: '{{quantity}}',
        OrderValidity: 1,
        FinancialProviderId: 1,
      },
      null,
      2
    ),
    notes: 'بعد از انتخاب، آدرس و قالب بدنه سفارش روی تدبیر تنظیم می‌شود. برای شلیک واقعی، توکن Authorization را از cURL وارد کنید.',
  },
  {
    id: 'mofid',
    name: 'مفید — ایزی‌تریدر (EasyTrader)',
    description: 'سامانه وب کارگزاری مفید',
    sampleUrl: 'https://api.easytrader.emofid.com/core/api/v1/orders',
    defaultHeaders: {
      ...JSON_HEADERS,
      Authorization: 'Bearer YOUR_ACCESS_TOKEN',
    },
    defaultBody: JSON.stringify(
      {
        isin: '{{isin}}',
        side: 1,
        price: '{{price}}',
        quantity: '{{quantity}}',
        validityType: 1,
      },
      null,
      2
    ),
    notes: 'قالب API مفید اعمال شد. توکن Bearer را از Network مرورگر در بخش cURL جایگزین کنید.',
  },
  {
    id: 'agah',
    name: 'آگاه — سامانه آسا (ASA)',
    description: 'موتور آنلاین کارگزاری آگاه',
    sampleUrl: 'https://asa.agah.com/api/v1/order',
    defaultHeaders: {
      ...JSON_HEADERS,
    },
    defaultBody: JSON.stringify(
      {
        InstrumentId: '{{isin}}',
        Side: 1,
        Price: '{{price}}',
        Quantity: '{{quantity}}',
        ValidityType: 1,
      },
      null,
      2
    ),
    notes: 'قالب آگاه اعمال شد. معمولاً احراز هویت با کوکی نشست است — cURL کامل را پیست کنید.',
  },
  {
    id: 'farabixo',
    name: 'فارابیکسو (Farabixo)',
    description: 'سامانه معاملات آنلاین فارابی',
    sampleUrl: 'https://api.farabixo.com/api/v1/Order',
    defaultHeaders: {
      ...JSON_HEADERS,
    },
    defaultBody: JSON.stringify(
      {
        isin: '{{isin}}',
        side: 'Buy',
        price: '{{price}}',
        quantity: '{{quantity}}',
      },
      null,
      2
    ),
    notes: 'قالب فارابیکسو اعمال شد. هدرها و بدنه را با یک درخواست واقعی از DevTools تکمیل کنید.',
  },
  {
    id: 'sahra',
    name: 'صحرا — داتکس',
    description: 'سامانه برخط مبتنی بر موتور صحرا / داتکس',
    sampleUrl: 'https://online.sahra.ir/CustomerOrder/SendOrder',
    defaultHeaders: {
      ...JSON_HEADERS,
    },
    defaultBody: JSON.stringify(
      {
        InstrumentId: '{{isin}}',
        Side: 1,
        Price: '{{price}}',
        Quantity: '{{quantity}}',
        ValidityType: 1,
      },
      null,
      2
    ),
    notes: 'قالب صحرا اعمال شد. کوکی نشست برای احراز هویت حیاتی است.',
  },
  {
    id: 'custom',
    name: 'سفارشی (از cURL)',
    description: 'بهترین روش: استخراج کامل URL، هدر و بدنه از دستور cURL مرورگر',
    sampleUrl: 'https://broker.ir/api/order',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'User-Agent': JSON_HEADERS['User-Agent'],
    },
    defaultBody: JSON.stringify(
      {
        symbol: '{{symbol}}',
        isin: '{{isin}}',
        price: '{{price}}',
        quantity: '{{quantity}}',
      },
      null,
      2
    ),
    notes: 'حالت سفارشی: از کارت «ورود مشخصات از طریق cURL» دستور واقعی سفارش را پیست کنید تا همه چیز خودکار پر شود.',
  },
];

export function findBrokerPreset(presetId: string): BrokerPreset | undefined {
  const id = resolveBrokerPresetId(presetId);
  return BROKER_PRESETS.find((p) => p.id === id);
}

/** Shared helper for applying a preset onto network + order.brokerType */
export function applyPresetToNetwork(
  network: Partial<NetworkConfig>,
  preset: BrokerPreset
): Pick<NetworkConfig, 'targetUrl' | 'headers' | 'bodyTemplate'> {
  return {
    targetUrl: preset.sampleUrl,
    headers: { ...preset.defaultHeaders },
    bodyTemplate: preset.defaultBody,
  };
}
