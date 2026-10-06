'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';
import { TimeSyncStatus } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AtomicClockProps {
  exactTime: string;
  exactMs: string;
  targetTime: string;
  timeSync: TimeSyncStatus | null;
  onSyncNtp: () => Promise<void>;
  onSetOffset: (offsetMs: number) => Promise<void>;
  leadTimeMs?: number;
}

export function AtomicClock({
  exactTime,
  exactMs,
  targetTime,
  timeSync,
  onSyncNtp,
  onSetOffset,
  leadTimeMs = 18,
}: AtomicClockProps) {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<{ main: string; ms: string }>({
    main: '00:00:00',
    ms: '.000',
  });
  const [progressPercent, setProgressPercent] = useState<number>(100);

  // Compute live countdown to targetTime
  useEffect(() => {
    if (!targetTime) return;

    try {
      const parts = targetTime.split(':');
      if (parts.length >= 3) {
        const targetH = parseInt(parts[0], 10);
        const targetM = parseInt(parts[1], 10);
        const secParts = parts[2].split('.');
        const targetS = parseInt(secParts[0], 10);
        const targetMs = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;

        const now = new Date();
        const targetDate = new Date(now);
        targetDate.setHours(targetH, targetM, targetS, targetMs);

        let diff = targetDate.getTime() - (now.getTime() + (timeSync?.offsetMs || 0));
        if (diff < 0) {
          diff = 0;
        }

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const ms = diff % 1000;

        const mainStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const msStr = `.${String(ms).padStart(3, '0')}`;

        setCountdownText({ main: mainStr, ms: msStr });

        const windowMs = 60000;
        const progress = Math.max(0, Math.min(100, 100 - (diff / windowMs) * 100));
        setProgressPercent(diff > windowMs ? 0 : progress);
      }
    } catch {
      // fallback
    }
  }, [exactTime, exactMs, targetTime, timeSync]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncNtp();
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyOffset = async (delta: number) => {
    const current = timeSync?.offsetMs || 0;
    await onSetOffset(current + delta);
  };

  return (
    <div id="tour-atomic-clock" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Atomic Clock Hero Panel */}
      <Card className="p-5 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">ساعت اتمی استاندارد بورس (NTP)</span>
              <span className="text-[10px] text-muted-foreground">کالیبره شده با سرور مرجع زمانی</span>
            </div>
          </div>

          <Badge variant="default">
            <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>{timeSync?.source || 'NTP L1 DIRECT'}</span>
          </Badge>
        </div>

        {/* Big digits */}
        <div className="my-2 flex items-baseline justify-center">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-foreground drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] inline-flex items-baseline">
            <span>{exactTime}</span>
            <span className="text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 font-bold neon-text-emerald">
              {exactMs}
            </span>
          </span>
        </div>

        {/* Telemetry info row */}
        <div id="tour-ntp-tuning" className="flex flex-wrap items-center justify-between pt-3 border-t border-border text-[11px]">
          <div className="flex items-center gap-3 text-muted-foreground font-mono">
            <span>
              OFFSET: <strong className="text-sky-600 dark:text-sky-400">{timeSync?.offsetMs !== undefined ? `${timeSync.offsetMs >= 0 ? '+' : ''}${timeSync.offsetMs.toFixed(1)}ms` : '-14.2ms'}</strong>
            </span>
            <span>
              RTT: <strong className="text-emerald-600 dark:text-emerald-400">{timeSync?.rttMs ?? '15'}ms</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-[11px] gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
              <span>{syncing ? 'در حال کالیبراسیون...' : 'همگام‌سازی فوری'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Countdown to Opening Bell */}
      <Card className="p-5 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">شمارش معکوس شلیک</span>
              <span className="text-[10px] text-muted-foreground">زمان دقیق ارسال سفارش سرخطی</span>
            </div>
          </div>

          <Badge variant="cyan">
            TARGET: {targetTime}
          </Badge>
        </div>

        {/* Big countdown display */}
        <div className="my-2 flex items-baseline justify-center">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-cyan-600 dark:text-cyan-400 neon-text-cyan inline-flex items-baseline">
            <span>{countdownText.main}</span>
            <span className="text-2xl sm:text-3xl text-cyan-500 dark:text-cyan-300 font-bold opacity-90">
              {countdownText.ms}
            </span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-900/80 rounded-full h-1.5 overflow-hidden my-1">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400 h-full rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lead time adjustments */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-[11px]">
          <span className="text-cyan-600 dark:text-cyan-300/80 font-mono text-xs">
            LEAD-TIME: -{leadTimeMs}ms
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground ml-1">افست دستی:</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleApplyOffset(-5)}
              className="h-6 px-2 text-xs font-mono"
              title="کاهش ۵ میلی‌ثانیه"
            >
              -5ms
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleApplyOffset(-1)}
              className="h-6 px-2 text-xs font-mono"
              title="کاهش ۱ میلی‌ثانیه"
            >
              -1ms
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleApplyOffset(1)}
              className="h-6 px-2 text-xs font-mono"
              title="افزایش ۱ میلی‌ثانیه"
            >
              +1ms
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleApplyOffset(5)}
              className="h-6 px-2 text-xs font-mono"
              title="افزایش ۵ میلی‌ثانیه"
            >
              +5ms
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
