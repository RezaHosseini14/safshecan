'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw, SlidersHorizontal, Timer } from 'lucide-react';
import type { TimeSyncStatus } from '@saf-shekan/core';
import { Num } from '@/components/num';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatSignedMs } from '@/lib/format';
import { clockToMs, formatDuration } from '@/features/console/clock';

export function AtomicClocks({
  exactTime,
  exactMs,
  targetTime,
  leadTimeMs,
  timeSync,
  onSync,
  onNudgeOffset,
}: {
  exactTime: string;
  exactMs: string;
  targetTime: string;
  leadTimeMs: number;
  timeSync: TimeSyncStatus | null;
  onSync: () => void;
  onNudgeOffset: (delta: number) => void;
}) {
  const t = useTranslations('console');
  const nowMs = clockToMs(`${exactTime}${exactMs.startsWith('.') ? exactMs : `.${exactMs}`}`);
  const targetMs = clockToMs(targetTime);
  const remaining =
    nowMs != null && targetMs != null ? formatDuration(targetMs - nowMs) : { clock: '00:00:00', fraction: '000' };

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col justify-between">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{t('clockTitle')}</h2>
              <p className="text-[11px] text-slate-400">{t('clockHint')}</p>
            </div>
          </div>
          <Badge variant="emerald">
            {timeSync?.synchronized ? timeSync.source || 'NTP' : t('awaitingSync')}
          </Badge>
        </div>
        <div className="py-4 text-center">
          <div className="num-mono text-5xl font-black tracking-tight xl:text-6xl">
            {exactTime}
            <span className="text-3xl font-bold text-emerald-500 xl:text-4xl">{exactMs}</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/6 pt-3 text-xs">
          <Button type="button" variant="outline" size="sm" onClick={onSync}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('syncNow')}
          </Button>
          <div className="text-[11px] text-slate-400" dir="ltr">
            OFFSET:{' '}
            {timeSync ? (
              <>
                <Num className="font-bold text-cyan-400">{formatSignedMs(timeSync.offsetMs).replace(/ms$/, '')}</Num> ms
              </>
            ) : (
              <Num className="font-bold text-cyan-400">—</Num>
            )}
            <span className="mx-3">
              RTT:{' '}
              {timeSync ? (
                <>
                  <Num className="font-bold text-emerald-400">{Math.round(timeSync.rttMs)}</Num> ms
                </>
              ) : (
                <Num className="font-bold text-emerald-400">—</Num>
              )}
            </span>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col justify-between">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{t('countdownTitle')}</h2>
              <p className="text-[11px] text-slate-400">{t('countdownHint')}</p>
            </div>
          </div>
          <Badge variant="cyan">
            TARGET: <Num>{targetTime || '—'}</Num>
          </Badge>
        </div>
        <div className="py-4 text-center">
          <div className="num-mono text-5xl font-black tracking-tight text-cyan-400 xl:text-6xl">
            {remaining.clock}
            <span className="text-3xl font-bold text-cyan-300 xl:text-4xl">.{remaining.fraction}</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/6 pt-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">{t('manualOffset')}</span>
            {[-5, -1, 1, 5].map((delta) => (
              <Button key={delta} type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => onNudgeOffset(delta)}>
                <Num>{delta > 0 ? `+${delta}` : delta}</Num>ms
              </Button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400" dir="ltr">
            LEAD-TIME: <Num className="font-bold text-cyan-400">{leadTimeMs}</Num> ms
          </div>
        </div>
      </Card>
    </section>
  );
}
