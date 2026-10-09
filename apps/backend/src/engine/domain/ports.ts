import type { BotConfig, OrderShotResult, ServerBroadcastMessage, TimeSyncStatus } from '@saf-shekan/core';

export interface ClockPort {
  getExactTimestampMs(): number;
  getExactNow(): Date;
  getStatus(): TimeSyncStatus;
}

export interface ShotRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export interface ShotResponse {
  statusCode: number;
  body: string;
}

export interface OrderTransportPort {
  send(request: ShotRequest): Promise<ShotResponse>;
  preWarm(targetUrl: string, headers: Record<string, string>): Promise<number>;
}

export interface BroadcasterPort {
  broadcast(message: ServerBroadcastMessage): void;
  connectedClients(): number;
}

export interface SniperPorts {
  clock: ClockPort;
  transport: OrderTransportPort;
  broadcaster: BroadcasterPort;
  readConfig: () => BotConfig;
}

export type BrokerAnalysis = {
  isSuccess: boolean;
  trackingCode?: string;
  errorMessage?: string;
  queueRank?: number;
};

export type ShotSnapshot = Pick<OrderShotResult, 'symbol' | 'broker' | 'orderValueRials'>;
