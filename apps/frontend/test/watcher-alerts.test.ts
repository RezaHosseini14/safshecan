import { describe, expect, it } from 'vitest';
import type { LiveQuote } from '@/lib/api';
import { matchesFilter } from '@/features/watcher/watcher-metrics';
import { alertEdges, type AlertSnapshot } from '@/features/watcher/watcher-alerts';

function quote(partial: Partial<LiveQuote> = {}): LiveQuote {
  return {
    ok: true,
    degraded: false,
    symbol: 'TST',
    name: 'Test',
    isin: '',
    insCode: '',
    lastPrice: 1000,
    closingPrice: 1000,
    yesterdayPrice: 900,
    change: 100,
    changePercent: 1,
    openPrice: 900,
    highPrice: 1000,
    lowPrice: 900,
    pMax: 1100,
    pMin: 800,
    volume: 10,
    value: 10000,
    tradesCount: 1,
    orderBook: [],
    clientFlow: {
      buyIndividualVolume: 10,
      sellIndividualVolume: 20,
      buyIndividualCount: 2,
      sellIndividualCount: 2,
      buyLegalVolume: 0,
      sellLegalVolume: 0,
      buyLegalCount: 0,
      sellLegalCount: 0,
    },
    fetchedAt: '2026-01-01T00:00:00.000Z',
    source: 'TSETMC',
    ...partial,
  };
}

function snap(partial: Partial<AlertSnapshot> = {}): AlertSnapshot {
  return {
    ceiling: false,
    nearFloor: false,
    power: 1,
    netFlow: -1,
    blockFingerprint: '',
    rsi: 50,
    ...partial,
  };
}

describe('watcher filters', () => {
  it('hides a symbol from the block filter until the dossier marks a block', () => {
    expect(matchesFilter('block', quote(), {})).toBe(false);
    expect(matchesFilter('block', quote(), { hasBlock: false })).toBe(false);
    expect(matchesFilter('block', null, { hasBlock: true })).toBe(true);
  });
});

describe('alert edges', () => {
  it('does not fire on the first snapshot', () => {
    expect(alertEdges(null, snap({ ceiling: true, power: 4, rsi: 80 }))).toEqual([]);
  });

  it('fires once when each threshold is crossed', () => {
    const previous = snap();
    expect(
      alertEdges(previous, snap({ ceiling: true, nearFloor: true, power: 2, netFlow: 5, rsi: 71 })),
    ).toEqual(['ceiling', 'floor', 'power', 'flow', 'rsiHigh']);
    expect(alertEdges(snap({ rsi: 40 }), snap({ rsi: 30 }))).toEqual(['rsiLow']);
    expect(alertEdges(snap({ blockFingerprint: '' }), snap({ blockFingerprint: '1|2|3|large' }))).toEqual(['block']);
  });

  it('stays quiet while the snapshot stays on the same side of the line', () => {
    const hot = snap({ ceiling: true, power: 3, netFlow: 8, rsi: 81, blockFingerprint: 'same' });
    expect(alertEdges(hot, { ...hot, power: 3.4 })).toEqual([]);
  });
});
