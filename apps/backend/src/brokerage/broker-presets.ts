import { t } from '@saf-shekan/i18n';
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
    name: t('brokers', 'preset.tadbir.name'),
    description: t('brokers', 'preset.tadbir.description'),
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
    notes: t('brokers', 'preset.tadbir.notes'),
  },
  {
    id: 'mofid',
    name: t('brokers', 'preset.mofid.name'),
    description: t('brokers', 'preset.mofid.description'),
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
    notes: t('brokers', 'preset.mofid.notes'),
  },
  {
    id: 'agah',
    name: t('brokers', 'preset.agah.name'),
    description: t('brokers', 'preset.agah.description'),
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
    notes: t('brokers', 'preset.agah.notes'),
  },
  {
    id: 'farabixo',
    name: t('brokers', 'preset.farabixo.name'),
    description: t('brokers', 'preset.farabixo.description'),
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
    notes: t('brokers', 'preset.farabixo.notes'),
  },
  {
    id: 'sahra',
    name: t('brokers', 'preset.sahra.name'),
    description: t('brokers', 'preset.sahra.description'),
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
    notes: t('brokers', 'preset.sahra.notes'),
  },
  {
    id: 'custom',
    name: t('brokers', 'preset.custom.name'),
    description: t('brokers', 'preset.custom.description'),
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
    notes: t('brokers', 'preset.custom.notes'),
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
