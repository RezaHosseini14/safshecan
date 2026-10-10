import type {
  BotConfig,
  BrokerType,
  ServerStatusResponse,
  ShotResult,
  SymbolItem,
  TimeSyncStatus,
} from '@saf-shekan/core';

export interface OrderBookLevel {
  level: number;
  bidPrice: number;
  bidVolume: number;
  bidOrders: number;
  askPrice: number;
  askVolume: number;
  askOrders: number;
}

export interface ClientFlow {
  buyIndividualVolume: number;
  buyLegalVolume: number;
  buyIndividualCount: number;
  buyLegalCount: number;
  sellIndividualVolume: number;
  sellLegalVolume: number;
  sellIndividualCount: number;
  sellLegalCount: number;
}

export interface LiveQuote {
  ok: boolean;
  degraded: boolean;
  warning?: string;
  symbol: string;
  name: string;
  isin: string;
  insCode: string;
  lastPrice: number;
  closingPrice: number;
  yesterdayPrice: number;
  change: number;
  changePercent: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  pMax?: number;
  pMin?: number;
  volume: number;
  value: number;
  tradesCount: number;
  stateTitle?: string;
  underSupervision?: number;
  orderBook: OrderBookLevel[];
  clientFlow: ClientFlow | null;
  fetchedAt: string;
  source: 'TSETMC' | 'CACHE' | 'EMPTY';
}

export interface MarketStatus {
  watchlist: string[];
  lastError: string | null;
  isPolling: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_PREFIX = '/api';

export function apiUrl(endpoint: string): string {
  if (!endpoint.startsWith('/')) {
    throw new ApiError('مسیر کلاینت باید با /api شروع شود', 0);
  }
  return `${API_PREFIX}${endpoint}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `خطای سرور (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(' | ');
      else if (typeof body.message === 'string') message = body.message;
    } catch {
      // keep fallback
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  getStatus: () => request<ServerStatusResponse>('/status'),
  saveConfig: (config: BotConfig) =>
    request<{ success: boolean; message: string }>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  applyPreset: (presetId: BrokerType | string) =>
    request<{ success: boolean; config: BotConfig }>('/presets/apply', {
      method: 'POST',
      body: JSON.stringify({ presetId }),
    }),
  parseCurl: (curl: string) =>
    request<{ success: boolean; config: BotConfig }>('/curl/parse', {
      method: 'POST',
      body: JSON.stringify({ curl }),
    }),
  syncTime: () =>
    request<{ success: boolean; status: TimeSyncStatus }>('/time/sync', { method: 'POST' }),
  setTimeOffset: (offsetMs: number) =>
    request<{ success: boolean; status: TimeSyncStatus }>('/time/offset', {
      method: 'POST',
      body: JSON.stringify({ offsetMs }),
    }),
  armSniper: () => request<{ success: boolean; message: string }>('/sniper/arm', { method: 'POST' }),
  disarmSniper: () =>
    request<{ success: boolean; message: string }>('/sniper/disarm', { method: 'POST' }),
  fireTestShot: () =>
    request<{ success: boolean; result: ShotResult }>('/sniper/test-shot', { method: 'POST' }),
  getReports: () => request<{ success: boolean; results: ShotResult[] }>('/reports'),
  pingBroker: (url?: string) =>
    request<{ success: boolean; pingMs: number }>('/network/ping', {
      method: 'POST',
      body: JSON.stringify(url ? { url } : {}),
    }),
  prewarmBroker: (url?: string) =>
    request<{ success: boolean; rttMs: number; message: string }>('/broker/test-connection', {
      method: 'POST',
      body: JSON.stringify(url ? { url } : {}),
    }),
  searchSymbols: async (query: string, limit = 80): Promise<SymbolItem[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (query) params.set('q', query);
    try {
      const data = await request<SymbolItem[]>(`/symbols?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  getMarketQuote: async (symbol: string): Promise<LiveQuote | null> => {
    try {
      return await request<LiveQuote>(`/market/quote?symbol=${encodeURIComponent(symbol)}`);
    } catch {
      return null;
    }
  },
  getMarketStatus: async (): Promise<MarketStatus> => {
    try {
      return await request<MarketStatus>('/market/status');
    } catch {
      return { watchlist: [], lastError: 'ارتباط برقرار نشد', isPolling: false };
    }
  },
  watchSymbol: (symbol: string) =>
    request<{ watchlist: string[] }>('/market/watch', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    }),
  unwatchSymbol: (symbol: string) =>
    request<{ watchlist: string[] }>(`/market/watch?symbol=${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    }),
};
