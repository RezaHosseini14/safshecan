import {
  ServerStatusResponse,
  BotConfig,
  BrokerType,
  ParsedCurlResult,
  SymbolItem,
  HistoricalIPO,
  BacktestReport,
  HistoricalBacktestReport,
  MonteCarloAnalysis,
  ShotResult,
  TimeSyncStatus,
  SymbolsSyncStatus,
  SymbolsRefreshResult,
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  public status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'SafShekan-Client',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) errorMsg = errorJson.message;
        else if (errorJson.error) errorMsg = errorJson.error;
      } catch {
        // use fallback message
      }
      throw new ApiError(errorMsg, response.status);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'خطا در برقراری ارتباط با سرور', 500);
  }
}

export const api = {
  // Status & Initial State
  getStatus: () => request<ServerStatusResponse>('/status'),

  // Symbols & Real-time IPOs
  getSymbols: (query?: string, onlyIpo?: boolean, market?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (onlyIpo) params.append('onlyIpo', 'true');
    if (market) params.append('market', market);
    const qs = params.toString();
    return request<SymbolItem[]>(qs ? `/symbols?${qs}` : '/symbols');
  },
  getIpos: () => request<SymbolItem[]>('/symbols/ipos'),
  getSymbolsStatus: () => request<SymbolsSyncStatus>('/symbols/status'),
  refreshSymbols: () => request<SymbolsRefreshResult>('/symbols/refresh', { method: 'POST' }),

  // Config Management
  saveConfig: (config: BotConfig) =>
    request<{ success: boolean; message: string }>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Presets
  applyPreset: (presetId: BrokerType) =>
    request<{ success: boolean; config: BotConfig }>('/presets/apply', {
      method: 'POST',
      body: JSON.stringify({ presetId }),
    }),

  // cURL Parser
  parseCurl: (curlCommand: string) =>
    request<{
      success: boolean;
      parsed: ParsedCurlResult;
      network: any;
      brokerInfo: any;
      accountInfo: any;
      extractedOrder: any;
      config: BotConfig;
    }>('/curl/parse', {
      method: 'POST',
      body: JSON.stringify({ curl: curlCommand }),
    }),

  // Network & Pre-warming
  testBrokerConnection: (url?: string, headers?: Record<string, string>) =>
    request<{ success: boolean; rttMs: number; url: string; message: string }>(
      '/broker/test-connection',
      {
        method: 'POST',
        body: JSON.stringify({ url, headers }),
      }
    ),

  pingBroker: (url?: string) =>
    request<{ success: boolean; pingMs: number }>('/network/ping', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  // Time Sync & Atomic Clock
  syncTime: () =>
    request<{ success: boolean; status: TimeSyncStatus }>('/time/sync', {
      method: 'POST',
    }),

  setTimeOffset: (offsetMs: number) =>
    request<{ success: boolean; status: TimeSyncStatus }>('/time/offset', {
      method: 'POST',
      body: JSON.stringify({ offsetMs }),
    }),

  // Sniper Engine Control
  armSniper: () =>
    request<{ success: boolean; message: string }>('/sniper/arm', {
      method: 'POST',
    }),

  disarmSniper: () =>
    request<{ success: boolean; message: string }>('/sniper/disarm', {
      method: 'POST',
    }),

  fireTestShot: () =>
    request<{ success: boolean; result: ShotResult }>('/sniper/test-shot', {
      method: 'POST',
    }),

  // Reports & Live Results
  getReports: () =>
    request<{
      success: boolean;
      results: ShotResult[];
      state: string;
      timeSync: TimeSyncStatus;
    }>('/reports'),

  // Backtest Simulations
  runOpeningBacktest: (runs: number = 5) =>
    request<{ success: boolean; report: BacktestReport }>('/backtest/run', {
      method: 'POST',
      body: JSON.stringify({ runs }),
    }),

  getHistoricalIPOs: () =>
    request<{ success: boolean; count: number; ipos: HistoricalIPO[] }>('/historical/ipos'),

  getBrokerProfiles: () =>
    request<{ success: boolean; brokers: Record<string, any> }>('/simulation/brokers'),

  runHistoricalBacktest: (params: {
    initialCapitalToman: number;
    allocationMode?: 'fixed' | 'percent' | 'kelly' | 'risk_parity';
    positionSizingPercent?: number;
    fixedAllocationToman?: number;
    connectionType?: string;
    customPingMs?: number;
    customJitterMs?: number;
    brokerOMS?: string;
    leadTimeMs?: number;
    burstCount?: number;
    burstIntervalMs?: number;
    targetSymbols?: string[];
    targetSectors?: string[];
    includeMonteCarlo?: boolean;
    monteCarloIterations?: number;
  }) =>
    request<{ success: boolean; report: HistoricalBacktestReport }>('/historical/backtest', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  runMonteCarlo: (params: {
    initialCapitalToman: number;
    allocationMode?: 'fixed' | 'percent' | 'kelly' | 'risk_parity';
    positionSizingPercent?: number;
    connectionType?: string;
    brokerOMS?: string;
    leadTimeMs?: number;
    burstCount?: number;
    burstIntervalMs?: number;
    monteCarloIterations?: number;
  }) =>
    request<{ success: boolean; analysis: MonteCarloAnalysis }>('/historical/monte-carlo', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
