import { describe, expect, it } from 'vitest';
import { t } from '@saf-shekan/i18n';
import {
  assembleDossier,
  assessRisk,
  buildNarrative,
  inferCodeToCode,
  intradayCandles,
  rsi14,
  volumeVsMonth,
  vwap,
} from '../src/market/dossier-rules.js';
import { LARGE_TRADE_RIALS, type CleanTrade, type DossierAssembleInput, type FlowSlice } from '../src/market/market-dossier.types.js';

const noonUtc = Date.UTC(2026, 9, 10, 8, 30, 0);
const earlierUtc = Date.UTC(2026, 9, 10, 8, 0, 0);

function flow(partial: Partial<FlowSlice> = {}): FlowSlice {
  return {
    buyIndividualVolume: 0,
    buyLegalVolume: 0,
    sellIndividualVolume: 0,
    sellLegalVolume: 0,
    ...partial,
  };
}

function trade(partial: Partial<CleanTrade> & Pick<CleanTrade, 'price' | 'volume'>): CleanTrade {
  return { hEven: 120500, dEven: 20261010, ...partial };
}

describe('dossier price math', () => {
  it('computes VWAP from price times volume', () => {
    expect(
      vwap([
        trade({ price: 10, volume: 100 }),
        trade({ price: 30, volume: 100 }),
      ])
    ).toBe(20);
  });

  it('returns null RSI until 15 closes exist', () => {
    expect(rsi14(Array.from({ length: 14 }, (_, index) => index + 1))).toBeNull();
  });

  it('returns 100 RSI when every close rises', () => {
    const closes = Array.from({ length: 15 }, (_, index) => 100 + index);
    expect(rsi14(closes)).toBe(100);
  });

  it('needs eight prior sessions before a month ratio', () => {
    expect(volumeVsMonth(200, Array.from({ length: 7 }, () => 100))).toBeNull();
    expect(volumeVsMonth(200, Array.from({ length: 8 }, () => 100))).toBe(2);
  });

  it('marks a print large at 5 billion rials and not one rial below', () => {
    const large = trade({ price: 1000, volume: LARGE_TRADE_RIALS / 1000 });
    const small = trade({ price: 1000, volume: LARGE_TRADE_RIALS / 1000 - 1 });
    const base = blankInput({ trades: [large, small], lastPrice: 1000 });
    const dossier = assembleDossier(base);
    const largeRows = dossier.trades.filter((row) => row.kind === 'large');
    expect(largeRows).toHaveLength(1);
    expect(largeRows[0]?.value).toBe(LARGE_TRADE_RIALS);
    expect(dossier.trades.some((row) => row.kind === 'normal')).toBe(true);
    expect(dossier.hasBlock).toBe(true);
    expect(dossier.narrative.summary).toContain(
      t('dossier', 'largest', {
        volume: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(largeRows[0]!.volume),
        price: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(largeRows[0]!.price),
      })
    );
  });
});

describe('code-to-code inference', () => {
  it('flags a matching print after two client-flow snapshots', () => {
    const marks = inferCodeToCode({
      nowMs: noonUtc,
      lastPrice: 100_000,
      previous: { atMs: earlierUtc, flow: flow() },
      next: flow({ buyIndividualVolume: 100_000, sellLegalVolume: 100_000 }),
      trades: [trade({ price: 100_000, volume: 100_000, hEven: 120500 })],
    });
    expect(marks).toEqual([{ index: 0, note: t('dossier', 'legalToReal') }]);
  });

  it('ignores the first snapshot and prints outside the interval', () => {
    const trades = [trade({ price: 100_000, volume: 100_000, hEven: 100000 })];
    expect(
      inferCodeToCode({
        nowMs: noonUtc,
        lastPrice: 100_000,
        previous: null,
        next: flow({ buyIndividualVolume: 100_000, sellLegalVolume: 100_000 }),
        trades,
      })
    ).toEqual([]);
    expect(
      inferCodeToCode({
        nowMs: noonUtc,
        lastPrice: 100_000,
        previous: { atMs: earlierUtc, flow: flow() },
        next: flow({ buyIndividualVolume: 100_000, sellLegalVolume: 100_000 }),
        trades,
      })
    ).toEqual([]);
  });

  it('does not flag when the two sides differ by half', () => {
    const marks = inferCodeToCode({
      nowMs: noonUtc,
      lastPrice: 100_000,
      previous: { atMs: earlierUtc, flow: flow() },
      next: flow({ buyIndividualVolume: 100_000, sellLegalVolume: 50_000 }),
      trades: [trade({ price: 100_000, volume: 100_000 })],
    });
    expect(marks).toEqual([]);
  });
});

describe('dossier narrative', () => {
  it('uses only numbers that were supplied', () => {
    const text = buildNarrative({
      symbol: 'فملی',
      lastPrice: 12345,
      changePercent: null,
      volume: null,
      buyerPower: null,
      rsi14: null,
      volumeVsMonth: null,
      largest: null,
      codeToCodeCount: 0,
      stateTitle: null,
    });
    expect(text.summary).toContain('12,345');
    expect(text.summary).not.toContain('RSI');
    expect(text.summary).not.toContain('99,999');
    expect(text.action).toBe(t('dossier', 'stateMissing'));
  });

  it('calls supervised names high risk and missing prices unknown', () => {
    expect(
      assessRisk({
        lastPrice: 100,
        changePercent: 1,
        pMin: 90,
        underSupervision: 1,
        buyerPower: 2,
      }).risk
    ).toBe('high');
    expect(
      assessRisk({
        lastPrice: 0,
        changePercent: null,
        pMin: null,
        underSupervision: null,
        buyerPower: null,
      }).risk
    ).toBe('unknown');
  });
});

describe('intraday candles', () => {
  it('merges prints that share a minute', () => {
    const candles = intradayCandles(
      [
        trade({ price: 10, volume: 5, hEven: 120010 }),
        trade({ price: 14, volume: 7, hEven: 120040 }),
      ],
      1,
      20261010
    );
    expect(candles).toHaveLength(1);
    expect(candles[0]?.open).toBe(10);
    expect(candles[0]?.close).toBe(14);
    expect(candles[0]?.high).toBe(14);
    expect(candles[0]?.low).toBe(10);
    expect(candles[0]?.volume).toBe(12);
  });
});

function blankInput(overrides: { trades: CleanTrade[]; lastPrice: number }): DossierAssembleInput {
  return {
    symbol: 'فملی',
    nowMs: noonUtc,
    quote: {
      ok: true,
      source: 'TSETMC',
      lastPrice: overrides.lastPrice,
      changePercent: 1,
      volume: 10,
      pMax: 1100,
      pMin: 900,
      stateTitle: 'مجاز',
      underSupervision: 0,
      clientFlow: null,
      orderBookLength: 1,
    },
    catalog: { pe: null, eps: null, group: null, baseVolume: null },
    trades: overrides.trades,
    tradesStatus: 'ok',
    daily: [],
    dailyStatus: 'ok',
    instrument: {
      received: false,
      group: null,
      sharesOutstanding: null,
      floatShares: null,
      floatPercent: null,
    },
    previousFlow: null,
    warnings: [],
  };
}
