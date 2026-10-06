'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { AtomicClock } from '../components/AtomicClock';
import { MasterControl } from '../components/MasterControl';
import { CurlParserCard } from '../components/CurlParserCard';
import { OrderForm } from '../components/OrderForm';
import { EngineSettings } from '../components/EngineSettings';
import { NetworkDiagnostics } from '../components/NetworkDiagnostics';
import { LiveTerminal } from '../components/LiveTerminal';
import { BacktestModal } from '../components/BacktestModal';
import { useSniperSocket } from '../hooks/useSniperSocket';
import { api } from '../lib/api';
import { startTour } from '../lib/tour';
import { BotConfig, TimingConfig, OrderConfig, BrokerType } from '../types';

export default function DashboardPage() {
  const {
    connected,
    engineState,
    exactTime,
    exactMs,
    targetTime,
    logs,
    shots,
    timeSync,
    clearLogs,
    addLog,
    setEngineState,
    setTimeSync,
  } = useSniperSocket();

  const [config, setConfig] = useState<BotConfig>({
    timing: {
      targetTime: '08:45:00.000',
      leadTimeMs: 18,
      burstCount: 5,
      burstIntervalMs: 2.5,
      preWarmTimeMs: 1500,
      ntpSyncIntervalMs: 60000,
    },
    order: {
      symbol: 'فزر',
      price: 25000,
      quantity: 500,
      brokerType: 'custom',
      isin: 'IRO1FAZR0001',
      side: 'BUY',
      antiDoubleSpend: true,
    },
    network: {
      targetUrl: 'https://onlineplus.tadbirpardaz.com/api/v1/Order/SendOrder',
      method: 'POST',
      headers: {},
      body: '{}',
      maxSockets: 10,
      timeoutMs: 3000,
    },
    account: {
      customerId: '984210',
      brokerName: 'تدبیرپرداز',
      title: 'کاربر آنلاین بورس',
    },
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isBacktestOpen, setIsBacktestOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Expose startTour to window and auto-trigger if ?tour=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).startTour = startTour;
      const params = new URLSearchParams(window.location.search);
      if (params.get('tour') === '1' || params.get('tour') === 'true') {
        setTimeout(() => startTour(), 600);
      }
    }
  }, []);

  // Initial load of config & status from API
  useEffect(() => {
    api
      .getStatus()
      .then((res) => {
        if (res.config) setConfig(res.config);
        if (res.state) setEngineState(res.state);
        if (res.timeSync) setTimeSync(res.timeSync);
      })
      .catch(() => {
        // will fallback to defaults
      });
  }, [setEngineState, setTimeSync]);

  // Master Arm
  const handleArm = async () => {
    setLoading(true);
    try {
      const res = await api.armSniper();
      showToast(res.message || 'ربات مسلح شد و در حالت انتظار شلیک قرار گرفت.');
      addLog({
        time: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
        level: 'warn',
        text: 'ربات مسلح شد. پیش‌گرمایش سوکت‌ها قبل از زمان بازگشایی شروع خواهد شد.',
      });
    } catch (err: any) {
      showToast(err.message || 'خطا در مسلح‌سازی ربات');
    } finally {
      setLoading(false);
    }
  };

  // Disarm
  const handleDisarm = async () => {
    setLoading(true);
    try {
      const res = await api.disarmSniper();
      showToast(res.message || 'ربات با موفقیت از حالت مسلح خارج شد.');
      addLog({
        time: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
        level: 'info',
        text: 'موتور سرخطی توسط کاربر غیرفعال (Disarmed) شد.',
      });
    } catch (err: any) {
      showToast(err.message || 'خطا در لغو آماده‌باش');
    } finally {
      setLoading(false);
    }
  };

  // Dry run / Test shot
  const handleTestShot = async () => {
    setLoading(true);
    try {
      const res = await api.fireTestShot();
      showToast(`شلیک آزمایشی انجام شد (کد پاسخ: ${res.result.httpStatus})`);
    } catch (err: any) {
      showToast(err.message || 'خطا در شلیک تستی');
    } finally {
      setLoading(false);
    }
  };

  // Sync NTP
  const handleSyncNtp = async () => {
    try {
      const res = await api.syncTime();
      if (res.status) {
        setTimeSync(res.status);
        showToast(`زمان با انحراف ${res.status.offsetMs}ms کالیبره شد.`);
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در همگام‌سازی زمان');
    }
  };

  // Manual time offset
  const handleSetOffset = async (offsetMs: number) => {
    try {
      const res = await api.setTimeOffset(offsetMs);
      if (res.status) {
        setTimeSync(res.status);
        showToast(`انحراف زمانی روی ${offsetMs}ms تنظیم شد.`);
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در تنظیم انحراف زمان');
    }
  };

  // Parse cURL
  const handleParseCurl = async (curl: string) => {
    const res = await api.parseCurl(curl);
    if (res.config) {
      setConfig(res.config);
      showToast('دستور cURL با موفقیت اعمال شد.');
      addLog({
        time: new Date().toLocaleTimeString('fa-IR', { hour12: false }),
        level: 'success',
        text: `پارامترهای cURL برای نماد ${res.config.order.symbol} اعمال شدند.`,
      });
    }
  };

  // Save timing config
  const handleSaveTiming = async (newTiming: TimingConfig) => {
    const updated = { ...config, timing: newTiming };
    await api.saveConfig(updated);
    setConfig(updated);
    showToast('تنظیمات زمان‌بندی با موفقیت ذخیره شد.');
  };

  // Update order config
  const handleOrderChange = (updatedOrder: Partial<OrderConfig>) => {
    const updated = {
      ...config,
      order: { ...config.order, ...updatedOrder },
    };
    setConfig(updated);
    api.saveConfig(updated).catch(() => {});
  };

  // Apply broker preset
  const handleApplyPreset = async (presetId: BrokerType) => {
    try {
      const res = await api.applyPreset(presetId);
      if (res.config) {
        setConfig(res.config);
        showToast(`قالب کارگزاری ${presetId.toUpperCase()} اعمال شد.`);
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در اعمال قالب کارگزاری');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-emerald-500/25 selection:text-emerald-500 dark:selection:text-emerald-300 bg-background text-foreground transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[550px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-[130px]" />
        <div className="absolute -bottom-20 left-1/3 w-[700px] h-[450px] bg-sky-600/5 dark:bg-sky-600/8 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <Header
        engineState={engineState}
        timeSync={timeSync}
        pingMs={timeSync?.rttMs || 18}
        connected={connected}
        onEmergencyStop={handleDisarm}
        onOpenBacktest={() => setIsBacktestOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 w-full z-10 flex-1 space-y-5">
        {/* Atomic Clock & Countdown Hero */}
        <AtomicClock
          exactTime={exactTime}
          exactMs={exactMs}
          targetTime={config.timing.targetTime}
          timeSync={timeSync}
          onSyncNtp={handleSyncNtp}
          onSetOffset={handleSetOffset}
          leadTimeMs={config.timing.leadTimeMs}
        />

        {/* Master Control */}
        <div id="tour-master-control">
          <MasterControl
            engineState={engineState}
            onArm={handleArm}
            onDisarm={handleDisarm}
            onTestShot={handleTestShot}
            antiDoubleSpend={config.order.antiDoubleSpend ?? true}
            onToggleAntiDoubleSpend={(val) => handleOrderChange({ antiDoubleSpend: val })}
            loading={loading}
          />
        </div>

        {/* cURL Import & Parser Card */}
        <div id="tour-curl-parser">
          <CurlParserCard
            onParseCurl={handleParseCurl}
            detectedBroker={config.order.brokerType}
            isAuthReady={Boolean(config.network.headers?.Authorization || config.network.headers?.authorization)}
          />
        </div>

        {/* Order Form & Engine Parameters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div id="tour-order-form">
            <OrderForm
              orderConfig={config.order}
              accountInfo={config.account}
              onChange={handleOrderChange}
              onApplyPreset={handleApplyPreset}
            />
          </div>
          <div id="tour-engine-settings">
            <EngineSettings timing={config.timing} onSaveTiming={handleSaveTiming} />
          </div>
        </div>

        {/* Network Diagnostics */}
        <div id="tour-network-diagnostics">
          <NetworkDiagnostics targetUrl={config.network.targetUrl} />
        </div>

        {/* Real-time Streaming Event Terminal */}
        <div id="tour-live-terminal">
          <LiveTerminal logs={logs} shots={shots} onClearLogs={clearLogs} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 bg-background/70 backdrop-blur-xl z-10 text-xs text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>صف‌شکن (SafShekan) - ترمینال سرخطی‌زن فوق‌سریع بورس تهران</span>
          <span className="font-mono text-[11px]">
            v2.0 Next.js Ultra HFT | High Precision hrtime & NTP Sync
          </span>
        </div>
      </footer>

      {/* Backtest Modal */}
      <BacktestModal isOpen={isBacktestOpen} onClose={() => setIsBacktestOpen(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-card border border-emerald-500/40 text-foreground text-xs shadow-2xl backdrop-blur-xl animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
