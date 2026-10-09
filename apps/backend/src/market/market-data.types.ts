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

export interface MarketDataStatus {
  watchlist: string[];
  lastPollAt: string | null;
  lastError: string | null;
  isPolling: boolean;
  cachedQuotes: number;
}
