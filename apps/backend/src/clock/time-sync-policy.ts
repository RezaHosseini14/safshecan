import type { TimeSyncStatus } from '@saf-shekan/core';

export function isManualTimeSource(source: string): boolean {
  return source.includes('دستی');
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
