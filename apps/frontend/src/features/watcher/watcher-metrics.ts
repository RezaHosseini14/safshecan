import type { SymbolItem } from '@saf-shekan/core';
import type { LiveQuote, OrderBookLevel } from '@/lib/api';

export type WatcherFilter = 'growth' | 'flow' | 'block' | 'light-queue';

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function closingChangePercent(quote: LiveQuote): number | null {
  if (!quote.yesterdayPrice) return null;
  return ((quote.closingPrice - quote.yesterdayPrice) / quote.yesterdayPrice) * 100;
}

export function priceBand(quote: LiveQuote): string | null {
  const yesterday = quote.yesterdayPrice;
  const { pMax, pMin } = quote;
  if (!yesterday || !pMax || !pMin || pMax <= 0 || pMin <= 0) return null;
  const up = ((pMax - yesterday) / yesterday) * 100;
  const down = ((pMin - yesterday) / yesterday) * 100;
  if (Math.abs(Math.abs(up) - Math.abs(down)) < 0.25) return `±${Math.abs(up).toFixed(0)}%`;
  return `${down.toFixed(1)}% / +${up.toFixed(1)}%`;
}

export function atCeiling(quote: LiveQuote): boolean {
  if (!quote.pMax || quote.pMax <= 0 || quote.lastPrice <= 0) return false;
  return quote.lastPrice >= quote.pMax * 0.999;
}

export function buyerPower(quote: LiveQuote | null): number | null {
  const sell = quote?.clientFlow?.sellIndividualVolume ?? 0;
  const buy = quote?.clientFlow?.buyIndividualVolume ?? 0;
  if (sell <= 0) return null;
  return buy / sell;
}

export function perCapitaBuyToman(quote: LiveQuote | null): number | null {
  const flow = quote?.clientFlow;
  if (!flow || flow.buyIndividualCount <= 0 || !quote || quote.lastPrice <= 0) return null;
  return (flow.buyIndividualVolume * quote.lastPrice) / flow.buyIndividualCount / 10;
}

export function suspiciousMultiple(quote: LiveQuote | null, meta: SymbolItem | null): number | null {
  const base = meta?.baseVolume;
  if (!quote || base == null || base <= 0) return null;
  return quote.volume / base;
}

export function netIndividualVolume(quote: LiveQuote | null): number | null {
  const flow = quote?.clientFlow;
  if (!flow) return null;
  return flow.buyIndividualVolume - flow.sellIndividualVolume;
}

export function queueStats(levels: OrderBookLevel[]) {
  let bidValue = 0;
  let askValue = 0;
  let buyers = 0;
  let offers = 0;
  let maxBid = 0;
  for (const level of levels) {
    bidValue += level.bidPrice * level.bidVolume;
    askValue += level.askPrice * level.askVolume;
    buyers += level.bidOrders;
    offers += level.askOrders;
    if (level.bidVolume > maxBid) maxBid = level.bidVolume;
  }
  const total = bidValue + askValue;
  return {
    bidValue,
    buyers,
    offers,
    maxBid,
    bidShare: total > 0 ? bidValue / total : 0,
  };
}

export function readPe(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function matchesFilter(
  filter: WatcherFilter | null,
  quote: LiveQuote | null,
  options?: { hasBlock?: boolean }
): boolean {
  if (!filter) return true;
  if (filter === 'block') return options?.hasBlock === true;
  if (!quote) return false;
  if (filter === 'growth') return quote.changePercent > 0;
  if (filter === 'flow') {
    const net = netIndividualVolume(quote);
    return net != null && net > 0;
  }
  const book = queueStats(quote.orderBook);
  return quote.changePercent > 0 && book.offers === 0 && book.buyers > 0;
}
