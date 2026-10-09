import type { BotConfig } from '@saf-shekan/core';

export const DEFAULT_CONFIG: BotConfig = {
  order: {
    symbol: 'عرضه_اولیه',
    price: 10000,
    quantity: 100,
    side: 'BUY',
    brokerType: 'custom',
  },
  network: {
    targetUrl: 'https://onlineplus.examplebroker.ir/api/Order/SendOrder',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    bodyTemplate: JSON.stringify(
      {
        symbol: '{{symbol}}',
        price: '{{price}}',
        quantity: '{{quantity}}',
        side: 1,
      },
      null,
      2
    ),
    cookies: '',
  },
  timing: {
    targetTime: '08:45:00.000',
    leadTimeMs: 15,
    burstCount: 8,
    burstIntervalMs: 40,
    preWarmSeconds: 12,
    stopOnFirstSuccess: true,
    ntpSyncIntervalMs: 15000,
  },
  serverPort: 3000,
  autoOpenBrowser: false,
  soundAlertEnabled: true,
  ntpServers: ['ir.pool.ntp.org', 'time.google.com', 'pool.ntp.org'],
};
