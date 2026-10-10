export const LARGE_TRADE_RIALS = 5_000_000_000;
/** Two volumes match when their gap is at most this share of the larger one. */
export const VOLUME_MATCH_TOLERANCE = 0.15;
/** Prior sessions required before a "month" volume ratio is claimed. */
export const MIN_MONTH_SESSIONS = 8;

export type RiskLabel = 'low' | 'medium' | 'high' | 'unknown';
export type TapeKind = 'normal' | 'large' | 'code-to-code';

export interface DossierTrade {
  time: string;
  price: number;
  volume: number;
  value: number;
  kind: TapeKind;
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

export interface DossierCandles {
  D: DossierCandle[];
  M15: DossierCandle[];
  M5: DossierCandle[];
  M1: DossierCandle[];
  tick: DossierCandle[];
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
  candles: DossierCandles;
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
    risk: RiskLabel;
    riskReason: string;
  };
  hasBlock: boolean;
  fetchedAt: string;
}

export interface CleanTrade {
  hEven: number;
  dEven: number;
  price: number;
  volume: number;
}

export interface CleanDaily {
  dEven: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FlowSlice {
  buyIndividualVolume: number;
  buyLegalVolume: number;
  sellIndividualVolume: number;
  sellLegalVolume: number;
}

export interface DossierAssembleInput {
  symbol: string;
  nowMs: number;
  quote: {
    ok: boolean;
    source: 'TSETMC' | 'CACHE' | 'EMPTY';
    lastPrice: number;
    changePercent: number | null;
    volume: number;
    pMax: number | null;
    pMin: number | null;
    stateTitle: string | null;
    underSupervision: number | null;
    clientFlow: FlowSlice | null;
    orderBookLength: number;
    warning?: string;
  } | null;
  catalog: {
    pe: number | null;
    eps: number | null;
    group: string | null;
    baseVolume: number | null;
  };
  trades: CleanTrade[];
  /** 'failed' when the CDN call rejected; 'ok' includes an empty tape. */
  tradesStatus: 'ok' | 'failed' | 'skipped';
  daily: CleanDaily[];
  dailyStatus: 'ok' | 'failed' | 'skipped';
  instrument: {
    received: boolean;
    group: string | null;
    sharesOutstanding: number | null;
    floatShares: number | null;
    floatPercent: number | null;
  };
  previousFlow: { atMs: number; flow: FlowSlice } | null;
  warnings: string[];
}
