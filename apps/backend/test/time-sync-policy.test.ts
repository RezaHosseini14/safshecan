import { describe, expect, it } from 'vitest';
import { BotConfigService } from '../src/bot-config/bot-config.service.js';
import { NestTimeSyncService } from '../src/clock/time-sync.service.js';
import { applySyncFailure, shouldRunScheduledSync } from '../src/clock/time-sync-policy.js';

describe('time sync schedule', () => {
  it('stops the scheduler while the source is a manual offset', () => {
    const service = new NestTimeSyncService(new BotConfigService());
    service.setManualOffset(-898);

    expect(shouldRunScheduledSync({ inFlight: false, source: service.getStatus().source })).toBe(false);
    expect(service.getStatus().offsetMs).toBe(-898);
    expect(service.getStatus().synchronized).toBe(true);

    service.releaseManualHold();

    expect(shouldRunScheduledSync({ inFlight: false, source: service.getStatus().source })).toBe(true);
    expect(service.getStatus().offsetMs).toBe(-898);
  });

  it('skips a tick that is already in flight', () => {
    expect(shouldRunScheduledSync({ inFlight: true, source: 'NTP (pool.ntp.org)' })).toBe(false);
  });

  it('clears synchronized on total failure and keeps the last offset', () => {
    const service = new NestTimeSyncService(new BotConfigService());
    service.setManualOffset(-898);
    const failed = applySyncFailure({
      ...service.getStatus(),
      rttMs: 73,
    });

    expect(failed.synchronized).toBe(false);
    expect(failed.offsetMs).toBe(-898);
    expect(failed.rttMs).toBe(73);

    service.adoptStatus(failed);
    expect(service.getStatus().synchronized).toBe(false);
    const before = Date.now();
    const exact = service.getExactTimestampMs();
    const after = Date.now();
    expect(exact).toBeGreaterThanOrEqual(before - 898);
    expect(exact).toBeLessThanOrEqual(after - 898);
  });
});
