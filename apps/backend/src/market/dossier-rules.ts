import {
  LARGE_TRADE_RIALS,
  MIN_MONTH_SESSIONS,
  VOLUME_MATCH_TOLERANCE,
  type CleanDaily,
  type CleanTrade,
  type DossierAssembleInput,
  type DossierCandle,
  type DossierCandles,
  type DossierTrade,
  type FlowSlice,
  type MarketDossier,
  type RiskLabel,
} from './market-dossier.types.js';
import { t } from '@saf-shekan/i18n';

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const TICK_CAP = 300;
const TAPE_CAP = 80;
const TAPE_FILL = 12;

export function parseLooseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function positiveNumber(value: unknown): number | null {
  const parsed = parseLooseNumber(value);
  if (parsed == null || parsed <= 0) return null;
  return parsed;
}

export function tehranParts(ms: number): { ymd: number; hEven: number } {
  const shifted = new Date(ms + TEHRAN_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hEven = shifted.getUTCHours() * 10000 + shifted.getUTCMinutes() * 100 + shifted.getUTCSeconds();
  return { ymd: year * 10000 + month * 100 + day, hEven };
}

export function formatHEven(hEven: number): string {
  const padded = String(Math.max(0, Math.floor(hEven))).padStart(6, '0').slice(-6);
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
}

function fmt(value: number, digits = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function closeEnough(left: number, right: number): boolean {
  const scale = Math.max(left, right);
  if (scale <= 0) return false;
  return Math.abs(left - right) / scale <= VOLUME_MATCH_TOLERANCE;
}

export function vwap(trades: CleanTrade[]): number | null {
  let notional = 0;
  let volume = 0;
  for (const trade of trades) {
    if (trade.price <= 0 || trade.volume <= 0) continue;
    notional += trade.price * trade.volume;
    volume += trade.volume;
  }
  if (volume <= 0) return null;
  return notional / volume;
}

/** Wilder RSI. Needs 15 closes (14 changes). Older closes first. */
export function rsi14(closesOldestFirst: number[]): number | null {
  const closes = closesOldestFirst.filter((price) => price > 0);
  if (closes.length < 15) return null;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= 14; index += 1) {
    const diff = closes[index] - closes[index - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  for (let index = 15; index < closes.length; index += 1) {
    const diff = closes[index] - closes[index - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
  }
  if (avgLoss === 0) return avgGain === 0 ? null : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function buyerPower(flow: FlowSlice | null): number | null {
  if (!flow || flow.sellIndividualVolume <= 0) return null;
  return flow.buyIndividualVolume / flow.sellIndividualVolume;
}

export function volumeVsMonth(todayVolume: number, priorVolumes: number[]): number | null {
  if (!Number.isFinite(todayVolume) || todayVolume < 0) return null;
  if (priorVolumes.length < MIN_MONTH_SESSIONS) return null;
  const sample = priorVolumes.slice(-20);
  const avg = sample.reduce((sum, volume) => sum + volume, 0) / sample.length;
  if (avg <= 0) return null;
  return todayVolume / avg;
}

export function volumeVsBase(todayVolume: number, baseVolume: number | null): number | null {
  if (!baseVolume || baseVolume <= 0 || todayVolume < 0) return null;
  return todayVolume / baseVolume;
}

export interface CodeToCodeMark {
  index: number;
  note: string;
}

/**
 * Public tape has no buyer or seller id. A jump that shows up on both the
 * individual and the legal side, plus a print of nearly the same size, is
 * only a possible کد به کد.
 */
export function inferCodeToCode(input: {
  previous: { atMs: number; flow: FlowSlice } | null;
  next: FlowSlice | null;
  trades: CleanTrade[];
  lastPrice: number;
  nowMs: number;
}): CodeToCodeMark[] {
  const { previous, next, trades, lastPrice, nowMs } = input;
  if (!previous || !next || lastPrice <= 0) return [];
  if (tehranParts(previous.atMs).ymd !== tehranParts(nowMs).ymd) return [];
  const since = tehranParts(previous.atMs).hEven;
  const interval = trades
    .map((trade, index) => ({ trade, index }))
    .filter(({ trade }) => trade.dEven === 0 || trade.dEven === tehranParts(nowMs).ymd)
    .filter(({ trade }) => trade.hEven >= since && trade.volume > 0 && trade.price > 0);
  const marks: CodeToCodeMark[] = [];
  const used = new Set<number>();
  const sides: { buy: number; sell: number; note: string }[] = [
    {
      buy: next.buyIndividualVolume - previous.flow.buyIndividualVolume,
      sell: next.sellLegalVolume - previous.flow.sellLegalVolume,
      note: t('dossier', 'legalToReal'),
    },
    {
      buy: next.buyLegalVolume - previous.flow.buyLegalVolume,
      sell: next.sellIndividualVolume - previous.flow.sellIndividualVolume,
      note: t('dossier', 'realToLegal'),
    },
  ];
  for (const side of sides) {
    if (side.buy <= 0 || side.sell <= 0) continue;
    if (!closeEnough(side.buy, side.sell)) continue;
    const size = Math.min(side.buy, side.sell);
    if (size * lastPrice < LARGE_TRADE_RIALS) continue;
    for (const row of interval) {
      if (used.has(row.index)) continue;
      if (!closeEnough(row.trade.volume, size)) continue;
      used.add(row.index);
      marks.push({ index: row.index, note: side.note });
    }
  }
  return marks;
}

function tradeUnix(dEven: number, hEven: number, fallbackYmd: number): number {
  const ymd = dEven > 19000101 ? dEven : fallbackYmd;
  const year = Math.floor(ymd / 10000);
  const month = Math.floor((ymd % 10000) / 100);
  const day = ymd % 100;
  const hour = Math.floor(hEven / 10000);
  const minute = Math.floor((hEven % 10000) / 100);
  const second = hEven % 100;
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - TEHRAN_OFFSET_MS;
  return Math.floor(utcMs / 1000);
}

function dayLabel(dEven: number): string {
  const month = Math.floor((dEven % 10000) / 100);
  const day = dEven % 100;
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function clockLabel(hEven: number): string {
  return formatHEven(hEven).slice(0, 5);
}

function pushCandle(bucket: Map<number, DossierCandle>, candle: DossierCandle): void {
  const existing = bucket.get(candle.time);
  if (!existing) {
    bucket.set(candle.time, candle);
    return;
  }
  existing.high = Math.max(existing.high, candle.high);
  existing.low = Math.min(existing.low, candle.low);
  existing.close = candle.close;
  existing.volume += candle.volume;
}

export function intradayCandles(trades: CleanTrade[], minutes: number, fallbackYmd: number): DossierCandle[] {
  const bucket = new Map<number, DossierCandle>();
  for (const trade of trades) {
    if (trade.price <= 0 || trade.volume <= 0) continue;
    const totalMinutes = Math.floor(trade.hEven / 10000) * 60 + Math.floor((trade.hEven % 10000) / 100);
    const start = Math.floor(totalMinutes / minutes) * minutes;
    const hour = Math.floor(start / 60);
    const minute = start % 60;
    const hEven = hour * 10000 + minute * 100;
    const time = tradeUnix(trade.dEven, hEven, fallbackYmd);
    pushCandle(bucket, {
      time,
      label: clockLabel(hEven),
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.volume,
    });
  }
  return [...bucket.values()].sort((a, b) => a.time - b.time);
}

export function tickCandles(trades: CleanTrade[], fallbackYmd: number): DossierCandle[] {
  const bucket = new Map<number, DossierCandle>();
  for (const trade of trades) {
    if (trade.price <= 0 || trade.volume <= 0) continue;
    const time = tradeUnix(trade.dEven, trade.hEven, fallbackYmd);
    pushCandle(bucket, {
      time,
      label: formatHEven(trade.hEven),
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.volume,
    });
  }
  const rows = [...bucket.values()].sort((a, b) => a.time - b.time);
  return rows.slice(-TICK_CAP);
}

export function dailyCandles(rows: CleanDaily[]): DossierCandle[] {
  const sorted = rows
    .filter((row) => row.close > 0 && row.dEven > 19000101)
    .slice()
    .sort((a, b) => a.dEven - b.dEven);
  return sorted.map((row) => ({
    time: tradeUnix(row.dEven, 123000, row.dEven),
    label: dayLabel(row.dEven),
    open: row.open > 0 ? row.open : row.close,
    high: row.high > 0 ? row.high : row.close,
    low: row.low > 0 ? row.low : row.close,
    close: row.close,
    volume: Math.max(0, row.volume),
  }));
}

export function assessRisk(input: {
  lastPrice: number;
  changePercent: number | null;
  pMin: number | null;
  underSupervision: number | null;
  buyerPower: number | null;
}): { risk: RiskLabel; reason: string } {
  if (input.lastPrice <= 0 || input.changePercent == null || !Number.isFinite(input.changePercent)) {
    return { risk: 'unknown', reason: t('dossier', 'priceMissing') };
  }
  const supervised = (input.underSupervision ?? 0) > 0;
  const nearFloor =
    input.pMin != null && input.pMin > 0 && input.lastPrice <= input.pMin * 1.005;
  const weak =
    input.buyerPower != null && input.buyerPower < 0.5 && input.changePercent < -2;
  if (supervised) {
    return { risk: 'high', reason: t('dossier', 'supervised') };
  }
  if (nearFloor && input.pMin != null) {
    return {
      risk: 'high',
      reason: t('dossier', 'nearFloor', { last: fmt(input.lastPrice), floor: fmt(input.pMin) }),
    };
  }
  if (weak && input.buyerPower != null) {
    return {
      risk: 'high',
      reason: t('dossier', 'weakBuyer', {
        power: fmt(input.buyerPower, 2),
        change: fmt(input.changePercent, 2),
      }),
    };
  }
  if (input.changePercent >= 0 && input.buyerPower != null && input.buyerPower >= 1) {
    return {
      risk: 'low',
      reason: t('dossier', 'calm', {
        change: fmt(input.changePercent, 2),
        power: fmt(input.buyerPower, 2),
      }),
    };
  }
  return {
    risk: 'medium',
    reason: t('dossier', 'neutral'),
  };
}

export function buildNarrative(input: {
  symbol: string;
  lastPrice: number;
  changePercent: number | null;
  volume: number | null;
  buyerPower: number | null;
  rsi14: number | null;
  volumeVsMonth: number | null;
  largest: DossierTrade | null;
  codeToCodeCount: number;
  stateTitle: string | null;
}): { summary: string; action: string } {
  if (!input.symbol || input.lastPrice <= 0) {
    return {
      summary: t('dossier', 'noServerData'),
      action: t('dossier', 'noServerData'),
    };
  }
  const bits = [t('dossier', 'lastPrice', { symbol: input.symbol, price: fmt(input.lastPrice) })];
  if (input.changePercent != null && Number.isFinite(input.changePercent)) {
    const sign = input.changePercent > 0 ? '+' : '';
    bits.push(t('dossier', 'change', { change: `${sign}${fmt(input.changePercent, 2)}` }));
  }
  if (input.volume != null && input.volume > 0) {
    bits.push(t('dossier', 'volume', { volume: fmt(input.volume) }));
  }
  if (input.buyerPower != null) {
    bits.push(t('dossier', 'buyerPower', { power: fmt(input.buyerPower, 2) }));
  }
  if (input.volumeVsMonth != null) {
    bits.push(t('dossier', 'month', { ratio: fmt(input.volumeVsMonth, 1) }));
  }
  if (input.largest) {
    bits.push(
      t('dossier', 'largest', {
        volume: fmt(input.largest.volume),
        price: fmt(input.largest.price),
      })
    );
  }
  if (input.codeToCodeCount > 0) {
    bits.push(t('dossier', 'codeToCode', { count: fmt(input.codeToCodeCount) }));
  }
  if (input.rsi14 != null) {
    bits.push(t('dossier', 'rsi', { value: fmt(input.rsi14, 1) }));
  }
  const action = input.stateTitle
    ? t('dossier', 'stateKnown', { state: input.stateTitle })
    : t('dossier', 'stateMissing');
  return { summary: bits.join(' '), action };
}

function emptyCandles(): DossierCandles {
  return { D: [], M15: [], M5: [], M1: [], tick: [] };
}

export function emptyDossier(symbol: string, warning: string, nowMs = Date.now()): MarketDossier {
  const risk = assessRisk({
    lastPrice: 0,
    changePercent: null,
    pMin: null,
    underSupervision: null,
    buyerPower: null,
  });
  return {
    ok: false,
    degraded: true,
    warning,
    symbol: symbol || '—',
    fundamentals: {
      pe: null,
      eps: null,
      group: null,
      sharesOutstanding: null,
      floatShares: null,
      floatPercent: null,
    },
    trades: [],
    largestTrade: null,
    candles: emptyCandles(),
    indicators: {
      vwap: null,
      rsi14: null,
      buyerPower: null,
      volumeVsMonth: null,
      volumeVsBase: null,
      coverage: { arrived: 0, expected: 6 },
    },
    references: { ceiling: null, floor: null, vwap: null },
    narrative: {
      summary: t('dossier', 'noServerData'),
      action: t('dossier', 'noServerData'),
      risk: risk.risk,
      riskReason: risk.reason,
    },
    hasBlock: false,
    fetchedAt: new Date(nowMs).toISOString(),
  };
}

export function assembleDossier(input: DossierAssembleInput): MarketDossier {
  const today = tehranParts(input.nowMs).ymd;
  const quote = input.quote;
  const lastPrice = quote?.lastPrice ?? 0;
  const power = buyerPower(quote?.clientFlow ?? null);
  const priceVwap = vwap(input.trades);
  const marks = inferCodeToCode({
    previous: input.previousFlow,
    next: quote?.clientFlow ?? null,
    trades: input.trades,
    lastPrice,
    nowMs: input.nowMs,
  });
  const markByIndex = new Map(marks.map((mark) => [mark.index, mark.note]));
  const ranked = input.trades
    .map((trade, index) => ({ trade, index, value: trade.price * trade.volume }))
    .filter((row) => row.trade.price > 0 && row.trade.volume > 0 && row.value > 0)
    .sort((a, b) => b.value - a.value);
  const picked = new Map<number, DossierTrade>();
  const pushRow = (row: (typeof ranked)[number], kind: DossierTrade['kind'], note: string) => {
    picked.set(row.index, {
      time: formatHEven(row.trade.hEven),
      price: row.trade.price,
      volume: row.trade.volume,
      value: row.value,
      kind,
      note,
    });
  };
  for (const row of ranked) {
    const note = markByIndex.get(row.index);
    const large = row.value >= LARGE_TRADE_RIALS;
    if (!note && !large) continue;
    pushRow(row, note ? 'code-to-code' : 'large', note ?? t('dossier', 'largeTrade'));
  }
  if (picked.size < TAPE_FILL) {
    for (const row of ranked) {
      if (picked.size >= TAPE_FILL) break;
      if (picked.has(row.index)) continue;
      pushRow(row, 'normal', t('dossier', 'fromTape'));
    }
  }
  const capped = [...picked.values()]
    .sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : b.value - a.value))
    .slice(0, TAPE_CAP);
  const largestTrade = capped.reduce<DossierTrade | null>(
    (best, trade) => (best == null || trade.value > best.value ? trade : best),
    null
  );
  const largestLarge = largestTrade && largestTrade.kind !== 'normal' ? largestTrade : null;
  const closes = input.daily
    .filter((row) => row.close > 0)
    .slice()
    .sort((a, b) => a.dEven - b.dEven)
    .map((row) => row.close);
  const rsi = rsi14(closes);
  const priorVolumes = input.daily
    .filter((row) => row.dEven !== today && row.volume > 0)
    .slice()
    .sort((a, b) => a.dEven - b.dEven)
    .map((row) => row.volume);
  const todayVolume = quote && quote.volume > 0 ? quote.volume : 0;
  const monthRatio = todayVolume > 0 ? volumeVsMonth(todayVolume, priorVolumes) : null;
  const baseRatio = volumeVsBase(todayVolume, input.catalog.baseVolume);
  const group = input.instrument.group || input.catalog.group;
  const ceiling = quote?.pMax && quote.pMax > 0 ? quote.pMax : null;
  const floor = quote?.pMin && quote.pMin > 0 ? quote.pMin : null;
  const risk = assessRisk({
    lastPrice,
    changePercent: quote?.changePercent ?? null,
    pMin: floor,
    underSupervision: quote?.underSupervision ?? null,
    buyerPower: power,
  });
  const codeToCodeCount = capped.filter((trade) => trade.kind === 'code-to-code').length;
  const narrative = buildNarrative({
    symbol: input.symbol,
    lastPrice,
    changePercent: quote?.changePercent ?? null,
    volume: todayVolume > 0 ? todayVolume : null,
    buyerPower: power,
    rsi14: rsi,
    volumeVsMonth: monthRatio,
    largest: largestLarge,
    codeToCodeCount,
    stateTitle: quote?.stateTitle ?? null,
  });
  const coverageFlags = [
    quote?.source === 'TSETMC' && quote.ok,
    (quote?.orderBookLength ?? 0) > 0,
    quote?.clientFlow != null,
    input.tradesStatus === 'ok',
    input.dailyStatus === 'ok',
    input.instrument.received,
  ];
  const warnings = input.warnings.filter((item) => item.trim().length > 0);
  if (quote?.warning) warnings.unshift(quote.warning);
  const arrived = coverageFlags.filter(Boolean).length;
  return {
    ok: lastPrice > 0 || capped.length > 0 || closes.length > 0,
    degraded: arrived < coverageFlags.length,
    warning: warnings.length > 0 ? [...new Set(warnings)].join(' — ') : undefined,
    symbol: input.symbol || '—',
    fundamentals: {
      pe: input.catalog.pe,
      eps: input.catalog.eps,
      group,
      sharesOutstanding: input.instrument.sharesOutstanding,
      floatShares: input.instrument.floatShares,
      floatPercent: input.instrument.floatPercent,
    },
    trades: capped,
    largestTrade,
    candles: {
      D: dailyCandles(input.daily),
      M15: intradayCandles(input.trades, 15, today),
      M5: intradayCandles(input.trades, 5, today),
      M1: intradayCandles(input.trades, 1, today),
      tick: tickCandles(input.trades, today),
    },
    indicators: {
      vwap: priceVwap,
      rsi14: rsi,
      buyerPower: power,
      volumeVsMonth: monthRatio,
      volumeVsBase: baseRatio,
      coverage: { arrived, expected: coverageFlags.length },
    },
    references: { ceiling, floor, vwap: priceVwap },
    narrative: { ...narrative, risk: risk.risk, riskReason: risk.reason },
    hasBlock: capped.some((trade) => trade.kind !== 'normal'),
    fetchedAt: new Date(input.nowMs).toISOString(),
  };
}
