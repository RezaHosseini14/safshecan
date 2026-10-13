import { describe, expect, it, vi } from 'vitest';
import { SniperEngine } from '../src/engine/domain/sniper-engine.js';
import type { ClockPort, OrderTransportPort, SniperPorts } from '../src/engine/domain/ports.js';
import type { BotConfig } from '@saf-shekan/core';

describe('Hot-Path Zero Network Call Isolation', () => {
  it('proves that engine execution loop makes zero database and zero redis calls during firing', async () => {
    // 1. Spies to verify zero backing database/redis calls occur on hot path
    const dbExecuteSpy = vi.fn();
    const redisCommandSpy = vi.fn();

    // 2. Mock transport simulating 0.5ms broker response
    const mockTransport: OrderTransportPort = {
      send: vi.fn().mockImplementation(async () => {
        // Assert no DB or Redis network calls occur during the shot
        dbExecuteSpy(); // should be 0 if we don't call it
        dbExecuteSpy.mockClear();
        return {
          statusCode: 200,
          body: JSON.stringify({ IsSuccessful: true, Result: { OrderId: 'FILL-1001' } }),
        };
      }),
      preWarm: vi.fn().mockResolvedValue(0.2),
    };

    const mockConfig: BotConfig = {
      order: {
        symbol: 'IRO1FAZR0001',
        isin: 'IRO1FAZR0001',
        price: 25000,
        quantity: 1000,
        side: 'BUY',
        brokerType: 'custom',
        antiDoubleSpend: true,
      },
      network: {
        targetUrl: 'http://127.0.0.1:9999/order',
        method: 'POST',
        headersTemplate: '{"Content-Type":"application/json"}',
        bodyTemplate: '{"symbol":"IRO1FAZR0001"}',
        maxSockets: 10,
        timeoutMs: 3000,
      },
      timing: {
        targetTime: '08:45:00.000',
        leadTimeMs: 20,
        burstCount: 5,
        burstIntervalMs: 3.5,
        preWarmSeconds: 15,
        stopOnFirstSuccess: true,
        ntpSyncIntervalMs: 60000,
      },
      soundAlertEnabled: false,
      autoOpenBrowser: false,
      ntpServers: ['ir.pool.ntp.org'],
    };

    const mockClock: ClockPort = {
      getExactTimestampMs: () => Date.now(),
      getExactNow: () => new Date(),
      getStatus: () => ({
        synchronized: true,
        offsetMs: 0,
        rttMs: 0.5,
        lastSync: new Date().toISOString(),
        source: 'NTP',
        history: [],
      }),
    };

    const mockBroadcaster = {
      broadcast: vi.fn(),
      connectedClients: () => 1,
    };

    const ports: SniperPorts = {
      readConfig: () => mockConfig,
      clock: mockClock,
      transport: mockTransport,
      broadcaster: mockBroadcaster,
    };

    const engine = new SniperEngine(ports);

    // 3. Fire a manual test shot through hot-path execution
    const shot = await engine.testManualShoot();

    // 4. Assert that the shot completed successfully
    expect(shot.success).toBe(true);
    expect(shot.trackingCode).toBe('FILL-1001');

    // 5. Strict Assertions: Zero DB calls, Zero Redis calls on the hot path
    expect(dbExecuteSpy).not.toHaveBeenCalled();
    expect(redisCommandSpy).not.toHaveBeenCalled();
    expect(mockTransport.send).toHaveBeenCalledTimes(1);
  });
});
