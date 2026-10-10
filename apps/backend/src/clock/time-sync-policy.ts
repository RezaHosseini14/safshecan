import type { TimeSyncStatus } from '@saf-shekan/core';

export const MANUAL_TIME_SOURCE = 'manual';

export function isManualTimeSource(source: string): boolean {
  return source === MANUAL_TIME_SOURCE;
}

export function shouldRunScheduledSync(input: { inFlight: boolean; source: string }): boolean {
  if (input.inFlight) return false;
  return !isManualTimeSource(input.source);
}

export function applySyncFailure(status: TimeSyncStatus): TimeSyncStatus {
  return {
    ...status,
    synchronized: false,
  };
}
