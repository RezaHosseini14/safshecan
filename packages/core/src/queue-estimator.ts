/**
 * TSE Order Book Queue Estimator
 * Models matching engine queue arrival priority and probability of execution.
 */

export type QueueVerdictKey = 'rejected' | 'front' | 'competitive' | 'tail';

export interface QueueEstimate {
  estimatedPosition: number;
  arrivalDeltaMs: number;
  successProbabilityPercent: number;
  queueTier: 'VIP_FRONT' | 'TOP_10' | 'COMPETITIVE' | 'TAIL' | 'REJECTED';
  verdictKey: QueueVerdictKey;
  verdictRank: number | null;
}

/**
 * Estimate order book queue priority based on millisecond arrival offset from target time
 * @param arrivalTimeMs Epoch timestamp of order arrival at broker OMS
 * @param targetTimeMs Target opening timestamp (e.g. 08:45:00.000)
 * @param latencyMs Network RTT latency
 */
export function estimateQueuePosition(
  arrivalTimeMs: number,
  targetTimeMs: number,
  latencyMs: number
): QueueEstimate {
  const deltaMs = arrivalTimeMs - targetTimeMs;

  // Too early (penalty or rejection by broker OMS)
  if (deltaMs < -5) {
    return {
      estimatedPosition: 9999,
      arrivalDeltaMs: deltaMs,
      successProbabilityPercent: 0,
      queueTier: 'REJECTED',
      verdictKey: 'rejected',
      verdictRank: null,
    };
  }

  // Ideal golden microsecond window: 0ms to 15ms after opening bell
  if (deltaMs >= -5 && deltaMs <= 15) {
    const rank = Math.max(1, Math.round(1 + (deltaMs + 5) * 1.5 + (latencyMs > 30 ? 5 : 0)));
    return {
      estimatedPosition: rank,
      arrivalDeltaMs: deltaMs,
      successProbabilityPercent: Math.max(85, 100 - rank * 3),
      queueTier: rank <= 5 ? 'VIP_FRONT' : 'TOP_10',
      verdictKey: 'front',
      verdictRank: rank,
    };
  }

  // Fast window: 16ms to 60ms
  if (deltaMs <= 60) {
    const rank = Math.round(20 + (deltaMs - 15) * 4);
    return {
      estimatedPosition: rank,
      arrivalDeltaMs: deltaMs,
      successProbabilityPercent: Math.max(35, 75 - (rank - 20) * 0.5),
      queueTier: 'COMPETITIVE',
      verdictKey: 'competitive',
      verdictRank: rank,
    };
  }

  // Slow / Tail
  const rank = Math.round(200 + (deltaMs - 60) * 10);
  return {
    estimatedPosition: rank,
    arrivalDeltaMs: deltaMs,
    successProbabilityPercent: Math.max(2, 25 - (rank / 100)),
    queueTier: 'TAIL',
    verdictKey: 'tail',
    verdictRank: rank,
  };
}
