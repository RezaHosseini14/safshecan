'use client';

import { useEffect, useState } from 'react';
import type { BotConfig, BrokerType, OrderConfig, TimingConfig } from '@saf-shekan/core';
import { AtomicClocks } from '@/features/console/atomic-clocks';
import { CommandPanel } from '@/features/console/command-panel';
import { CurlBar } from '@/features/console/curl-bar';
import { LiveTerminal } from '@/features/console/live-terminal';
import { NetworkCard } from '@/features/console/network-card';
import { OrderCard } from '@/features/console/order-card';
import { TimingCard } from '@/features/console/timing-card';
import { api } from '@/lib/api';
import { REDACTED_SECRET } from '@/lib/security';
import type { useSniperSocket } from '@/lib/use-sniper-socket';

type SocketState = ReturnType<typeof useSniperSocket>;

const EMPTY_CONFIG: BotConfig = {
  timing: {
    targetTime: '08:45:00.000',
    leadTimeMs: 0,
    burstCount: 5,
    burstIntervalMs: 2.5,
    preWarmTimeMs: 3000,
  },
  order: {
    symbol: '',
    price: 0,
    quantity: 0,
    brokerType: 'custom',
    side: 'BUY',
    antiDoubleSpend: true,
  },
  network: {
    targetUrl: '',
    method: 'POST',
    headers: {},
    body: '{}',
  },
};

export function ConsoleDesk({ socket }: { socket: SocketState }) {
  const [config, setConfig] = useState<BotConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const { setEngineState, applyHttpTimeSync, applyLiveTimeSync } = socket;

  useEffect(() => {
    api
      .getStatus()
      .then((res) => {
        if (res.config) setConfig(res.config);
        if (res.state) setEngineState(res.state);
        if (res.timeSync) applyHttpTimeSync(res.timeSync);
      })
      .catch(() => notify('وضعیت سرور خوانده نشد'));
  }, [setEngineState, applyHttpTimeSync]);

  const saveOrder = (patch: Partial<OrderConfig>) => {
    const updated = { ...config, order: { ...config.order, ...patch } };
    setConfig(updated);
    api.saveConfig(updated).catch(() => notify('ذخیره سفارش ناموفق بود'));
  };

  const authHeader = Object.entries(config.network.headers || {}).find(([key]) => key.toLowerCase() === 'authorization');
  const authReady = Boolean(authHeader?.[1] && authHeader[1] !== '');

  return (
    <>
      <AtomicClocks
        exactTime={socket.exactTime}
        exactMs={socket.exactMs}
        targetTime={config.timing.targetTime}
        leadTimeMs={config.timing.leadTimeMs}
        timeSync={socket.timeSync}
        onSync={() => {
          api
            .syncTime()
            .then((res) => {
              applyLiveTimeSync(res.status);
              notify(`زمان با انحراف ${res.status.offsetMs}ms کالیبره شد`);
            })
            .catch((err: unknown) => notify(err instanceof Error ? err.message : 'خطا در همگام‌سازی'));
        }}
        onNudgeOffset={(delta) => {
          const next = (socket.timeSync?.offsetMs ?? 0) + delta;
          api
            .setTimeOffset(next)
            .then((res) => {
              applyLiveTimeSync(res.status);
              notify(`انحراف زمانی روی ${next}ms تنظیم شد`);
            })
            .catch((err: unknown) => notify(err instanceof Error ? err.message : 'خطا در آفست'));
        }}
      />
      <CommandPanel
        engineState={socket.engineState}
        antiDoubleSpend={config.order.antiDoubleSpend ?? true}
        loading={loading}
        onToggleAntiDoubleSpend={(value) => saveOrder({ antiDoubleSpend: value })}
        onArm={() => {
          setLoading(true);
          api
            .armSniper()
            .then((res) => notify(res.message || 'موتور مسلح شد'))
            .catch((err: unknown) => notify(err instanceof Error ? err.message : 'خطا در مسلح‌سازی'))
            .finally(() => setLoading(false));
        }}
        onDisarm={() => {
          setLoading(true);
          api
            .disarmSniper()
            .then((res) => notify(res.message || 'آماده‌باش لغو شد'))
            .catch((err: unknown) => notify(err instanceof Error ? err.message : 'خطا در توقف'))
            .finally(() => setLoading(false));
        }}
        onTestShot={() => {
          setLoading(true);
          api
            .fireTestShot()
            .then((res) => notify(`شلیک آزمایشی انجام شد (${res.result.httpStatus})`))
            .catch((err: unknown) => notify(err instanceof Error ? err.message : 'خطا در شلیک تستی'))
            .finally(() => setLoading(false));
        }}
      />
      <CurlBar
        brokerLabel={(config.order.brokerType || 'custom').toUpperCase()}
        authReady={authReady && authHeader?.[1] !== REDACTED_SECRET ? true : authHeader?.[1] === REDACTED_SECRET}
        onParse={async (curl) => {
          const res = await api.parseCurl(curl);
          if (res.config) {
            setConfig(res.config);
            notify('دستور cURL اعمال شد. رازها در پاسخ سرور پوشانده شده‌اند.');
          }
        }}
      />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrderCard
          config={config}
          onChange={saveOrder}
          onApplyPreset={(presetId) => {
            api
              .applyPreset(presetId as BrokerType)
              .then((res) => {
                if (res.config) setConfig(res.config);
                notify('قالب کارگزاری اعمال شد');
              })
              .catch((err: unknown) => notify(err instanceof Error ? err.message : 'اعمال قالب ناموفق بود'));
          }}
        />
        <TimingCard
          timing={config.timing}
          onSave={async (timing: TimingConfig) => {
            const updated = { ...config, timing };
            await api.saveConfig(updated);
            setConfig(updated);
            notify('تنظیمات زمان‌بندی ذخیره شد');
          }}
        />
      </section>
      <NetworkCard targetUrl={config.network.targetUrl} />
      <LiveTerminal logs={socket.logs} onClear={socket.clearLogs} />
      {toast ? (
        <div className="fixed bottom-6 start-6 z-50 rounded-lg border border-emerald-500/40 bg-[#0f131c] px-4 py-3 text-xs">
          {toast}
        </div>
      ) : null}
    </>
  );
}
