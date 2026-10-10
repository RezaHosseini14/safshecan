import type { LiveQuote, MarketDossier } from '@/lib/api';
import { atCeiling, buyerPower, netIndividualVolume } from '@/features/watcher/watcher-metrics';

const STORAGE_KEY = 'watcherAlerts:v1';
const POWER_LINE = 2;
const RSI_HIGH = 70;
const RSI_LOW = 30;

export type AlertKind = 'ceiling' | 'floor' | 'power' | 'flow' | 'block' | 'rsiHigh' | 'rsiLow';

export interface AlertSnapshot {
  ceiling: boolean;
  nearFloor: boolean;
  power: number | null;
  netFlow: number | null;
  blockFingerprint: string | null;
  rsi: number | null;
}

export interface AlertHit {
  symbol: string;
  kind: AlertKind;
}

function nearFloor(quote: LiveQuote): boolean {
  if (!quote.pMin || quote.pMin <= 0 || quote.lastPrice <= 0) return false;
  return quote.lastPrice <= quote.pMin * 1.005;
}

function blockFingerprint(dossier: MarketDossier | null): string | null {
  if (!dossier) return null;
  const trade = dossier.trades.find((item) => item.kind !== 'normal');
  if (!trade) return '';
  return `${trade.time}|${trade.price}|${trade.volume}|${trade.kind}`;
}

export function readAlertSnapshot(quote: LiveQuote | null, dossier: MarketDossier | null): AlertSnapshot | null {
  if (!quote) return null;
  return {
    ceiling: atCeiling(quote),
    nearFloor: nearFloor(quote),
    power: buyerPower(quote),
    netFlow: netIndividualVolume(quote),
    blockFingerprint: blockFingerprint(dossier),
    rsi: dossier?.indicators.rsi14 ?? null,
  };
}

/** Fires only when a threshold is crossed. The first snapshot is a baseline. */
export function alertEdges(previous: AlertSnapshot | null, next: AlertSnapshot): AlertKind[] {
  if (!previous) return [];
  const kinds: AlertKind[] = [];
  if (!previous.ceiling && next.ceiling) kinds.push('ceiling');
  if (!previous.nearFloor && next.nearFloor) kinds.push('floor');
  if (previous.power != null && next.power != null && previous.power < POWER_LINE && next.power >= POWER_LINE) {
    kinds.push('power');
  }
  if (previous.netFlow != null && next.netFlow != null && previous.netFlow <= 0 && next.netFlow > 0) {
    kinds.push('flow');
  }
  if (
    previous.blockFingerprint != null &&
    next.blockFingerprint != null &&
    next.blockFingerprint !== '' &&
    previous.blockFingerprint !== next.blockFingerprint
  ) {
    kinds.push('block');
  }
  if (previous.rsi != null && next.rsi != null) {
    if (previous.rsi < RSI_HIGH && next.rsi >= RSI_HIGH) kinds.push('rsiHigh');
    if (previous.rsi > RSI_LOW && next.rsi <= RSI_LOW) kinds.push('rsiLow');
  }
  return kinds;
}

export function collectAlertHits(
  symbols: string[],
  armed: ReadonlySet<string>,
  previous: Record<string, AlertSnapshot>,
  read: (symbol: string) => AlertSnapshot | null,
): { next: Record<string, AlertSnapshot>; hits: AlertHit[] } {
  const next = { ...previous };
  const hits: AlertHit[] = [];
  for (const symbol of symbols) {
    const snapshot = read(symbol);
    if (!snapshot) continue;
    if (armed.has(symbol)) {
      for (const kind of alertEdges(previous[symbol] ?? null, snapshot)) {
        hits.push({ symbol, kind });
      }
    }
    next[symbol] = snapshot;
  }
  return { next, hits };
}

export function loadArmedSymbols(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch {
    return [];
  }
}

export function saveArmedSymbols(symbols: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // Private mode or a full quota leaves the in-memory set in place.
  }
}

export function requestAlertPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  void Notification.requestPermission();
}

export function postBrowserAlert(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers reject a page-constructed notification.
  }
}
