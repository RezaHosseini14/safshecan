import type { SniperState } from '@saf-shekan/core';

export function isEngineHot(state: SniperState): boolean {
  return state === 'ARMED' || state === 'PRE_WARMING' || state === 'FIRING';
}
