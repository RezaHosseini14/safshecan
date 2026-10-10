import type {
  BotConfig,
  BrokerType,
  ServerStatusResponse,
  ShotResult,
  SymbolItem,
  TimeSyncStatus,
} from '@saf-shekan/core';
import { t } from '@saf-shekan/i18n';

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

export interface DossierTrade {
  time: string;
  price: number;
  volume: number;
  value: number;
  kind: 'normal' | 'large' | 'code-to-code';
  note: string;
}

export interface DossierCandle {
  time: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDossier {
  ok: boolean;
  degraded: boolean;
  warning?: string;
  symbol: string;
  fundamentals: {
    pe: number | null;
    eps: number | null;
    group: string | null;
    sharesOutstanding: number | null;
    floatShares: number | null;
    floatPercent: number | null;
  };
  trades: DossierTrade[];
  largestTrade: DossierTrade | null;
  candles: {
    D: DossierCandle[];
    M15: DossierCandle[];
    M5: DossierCandle[];
    M1: DossierCandle[];
    tick: DossierCandle[];
  };
  indicators: {
    vwap: number | null;
    rsi14: number | null;
    buyerPower: number | null;
    volumeVsMonth: number | null;
    volumeVsBase: number | null;
    coverage: { arrived: number; expected: number };
  };
  references: {
    ceiling: number | null;
    floor: number | null;
    vwap: number | null;
  };
  narrative: {
    summary: string;
    action: string;
    risk: 'low' | 'medium' | 'high' | 'unknown';
    riskReason: string;
  };
  hasBlock: boolean;
  fetchedAt: string;
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
    throw new ApiError(t('common', 'clientPath'), 0);
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
    let message = t('common', 'serverError', { status: response.status });
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
  searchSymbols: async (
    query: string,
    limit = 80,
    options?: { brief?: boolean }
  ): Promise<SymbolItem[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (query) params.set('q', query);
    if (options?.brief) params.set('brief', '1');
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
  getMarketDossier: async (symbol: string): Promise<MarketDossier | null> => {
    try {
      return await request<MarketDossier>(`/market/dossier?symbol=${encodeURIComponent(symbol)}`);
    } catch {
      return null;
    }
  },
  getMarketStatus: async (): Promise<MarketStatus> => {
    try {
      return await request<MarketStatus>('/market/status');
    } catch {
      return { watchlist: [], lastError: t('common', 'connectionFailed'), isPolling: false };
    }
  },
  speakSummary: async (text: string, signal?: AbortSignal): Promise<Blob> => {
    const response = await fetch(apiUrl('/market/speech'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('audio')) {
      throw new ApiError(t('errors', 'speechDown'), response.status);
    }
    const blob = await response.blob();
    const head = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
    const mpeg = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
    const id3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
    if (!mpeg && !id3) throw new ApiError(t('errors', 'speechDown'), response.status);
    return blob;
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
