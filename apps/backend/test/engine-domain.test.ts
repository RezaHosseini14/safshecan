import { describe, expect, it } from 'vitest';
import { analyzeBrokerResponse } from '../src/engine/domain/broker-response.js';
import { shouldStopBurst } from '../src/engine/domain/shot-policy.js';

describe('broker response', () => {
  it('reads a Tadbir success and tracking code', () => {
    const analysis = analyzeBrokerResponse(
      200,
      JSON.stringify({ IsSuccessful: true, Result: { OrderId: 'T-42' }, queueRank: 3 })
    );
    expect(analysis.isSuccess).toBe(true);
    expect(analysis.trackingCode).toBe('T-42');
    expect(analysis.queueRank).toBe(3);
  });

  it('treats an HTTP error as a failed shot', () => {
    const analysis = analyzeBrokerResponse(400, JSON.stringify({ Message: 'rejected' }));
    expect(analysis.isSuccess).toBe(false);
    expect(analysis.errorMessage).toContain('400');
    expect(analysis.errorMessage).toContain('rejected');
  });
});

describe('shot policy', () => {
  it('stops after a confirmed fill when anti-double-spend is on', () => {
    expect(
      shouldStopBurst({
        aborted: false,
        confirmedFill: true,
        stopOnFirstSuccess: false,
        antiDoubleSpend: true,
      })
    ).toBe(true);
  });

  it('continues the burst when neither safety switch is on', () => {
    expect(
      shouldStopBurst({
        aborted: false,
        confirmedFill: true,
        stopOnFirstSuccess: false,
        antiDoubleSpend: false,
      })
    ).toBe(false);
  });

  it('stops immediately when the operator aborted', () => {
    expect(
      shouldStopBurst({
        aborted: true,
        confirmedFill: false,
        stopOnFirstSuccess: false,
        antiDoubleSpend: false,
      })
    ).toBe(true);
  });
});
