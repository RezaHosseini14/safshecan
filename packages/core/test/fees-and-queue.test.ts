import { describe, expect, it } from 'vitest';
import {
  calculateBreakEvenPrice,
  calculateBuyFee,
  calculateSellFee,
  estimateQueuePosition,
} from '../src/index.js';

describe('fee calculator', () => {
  it('adds the bourse buy commission to the trade value', () => {
    const fee = calculateBuyFee(10_000, 100, false);
    expect(fee.tradeValue).toBe(1_000_000);
    expect(fee.totalCost).toBe(Math.round(1_000_000 * 0.003712));
    expect(fee.netValue).toBe(fee.tradeValue + fee.totalCost);
    expect(fee.tax).toBe(0);
  });

  it('subtracts sell commission and tax from the trade value', () => {
    const fee = calculateSellFee(10_000, 100, false);
    expect(fee.tax).toBe(Math.round(1_000_000 * 0.005));
    expect(fee.brokerFee).toBe(Math.round(1_000_000 * 0.003712));
    expect(fee.netValue).toBe(fee.tradeValue - fee.totalCost);
  });

  it('uses the farabourse rates for breakeven', () => {
    const price = calculateBreakEvenPrice(10_000, true);
    const expected = Math.ceil((10_000 * (1 + 0.003632)) / (1 - 0.008632));
    expect(price).toBe(expected);
  });
});

describe('queue estimator', () => {
  const target = 1_700_000_000_000;

  it('rejects an arrival more than 5ms early', () => {
    const estimate = estimateQueuePosition(target - 6, target, 10);
    expect(estimate.queueTier).toBe('REJECTED');
    expect(estimate.successProbabilityPercent).toBe(0);
  });

  it('places the opening instant in the front tier', () => {
    const estimate = estimateQueuePosition(target - 5, target, 10);
    expect(estimate.queueTier).toBe('VIP_FRONT');
    expect(estimate.estimatedPosition).toBe(1);
  });

  it('keeps a small positive offset in the top ten window', () => {
    const estimate = estimateQueuePosition(target, target, 10);
    expect(estimate.queueTier).toBe('TOP_10');
  });

  it('marks the 16ms to 60ms window as competitive', () => {
    const estimate = estimateQueuePosition(target + 16, target, 10);
    expect(estimate.queueTier).toBe('COMPETITIVE');
    expect(estimate.estimatedPosition).toBe(24);
  });

  it('marks arrivals after 60ms as the tail', () => {
    const estimate = estimateQueuePosition(target + 61, target, 10);
    expect(estimate.queueTier).toBe('TAIL');
    expect(estimate.estimatedPosition).toBe(210);
  });
});
