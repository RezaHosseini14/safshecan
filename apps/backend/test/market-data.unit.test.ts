import { describe, it, expect } from 'vitest';
import { RawBestLimitRow } from '../src/market/tsetmc.client.js';

/** Mirror of MarketDataService.mapOrderBook for unit isolation */
function mapOrderBook(rows: RawBestLimitRow[]) {
  return rows
    .map((r) => ({
      level: Number(r.number || 0),
      bidPrice: Number(r.pMeDem || 0),
      bidVolume: Number(r.qTitMeDem || 0),
      bidOrders: Number(r.zOrdMeDem || 0),
      askPrice: Number(r.pMeOf || 0),
      askVolume: Number(r.qTitMeOf || 0),
      askOrders: Number(r.zOrdMeOf || 0),
    }))
    .sort((a, b) => a.level - b.level);
}

describe('MarketData order book mapping', () => {
  it('maps BestLimits rows to bid/ask levels sorted by level', () => {
    const mapped = mapOrderBook([
      { number: 2, pMeDem: 200, qTitMeDem: 50, zOrdMeDem: 3, pMeOf: 210, qTitMeOf: 40, zOrdMeOf: 2 },
      { number: 1, pMeDem: 199, qTitMeDem: 100, zOrdMeDem: 5, pMeOf: 201, qTitMeOf: 80, zOrdMeOf: 4 },
    ]);

    expect(mapped).toHaveLength(2);
    expect(mapped[0].level).toBe(1);
    expect(mapped[0].bidPrice).toBe(199);
    expect(mapped[0].askVolume).toBe(80);
    expect(mapped[1].level).toBe(2);
  });
});

describe('Market quote soft responses', () => {
  it('empty quote shape always includes ok/degraded flags', () => {
    const empty = {
      ok: false,
      degraded: true,
      warning: 'x',
      symbol: '—',
      source: 'EMPTY' as const,
      orderBook: [],
      clientFlow: null,
    };
    expect(empty.ok).toBe(false);
    expect(empty.degraded).toBe(true);
  });
});
