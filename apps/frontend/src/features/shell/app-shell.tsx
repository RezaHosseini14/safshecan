'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import type { SniperState, TimeSyncStatus } from '@saf-shekan/core';
import { Num } from '@/components/num';
import { Button } from '@/components/ui/button';
import { HeaderActions } from '@/features/shell/header-actions';
import { isEngineHot } from '@/lib/engine-state';
import { formatSignedMs, latencyClass } from '@/lib/format';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'داشبورد', match: (path: string) => path === '/' },
  {
    href: '/watcher',
    label: 'تحلیل و دیده‌بان TSETMC',
    match: (path: string) => path.startsWith('/watcher'),
  },
  { href: '/reports', label: 'گزارش‌ها', match: (path: string) => path.startsWith('/reports') },
] as const;

const STATE_LABEL: Record<SniperState, string> = {
  IDLE: 'آماده دریافت',
  ARMED: 'آماده‌باش',
  PRE_WARMING: 'پیش‌گرمایش',
  FIRING: 'شلیک رگباری',
  COMPLETED: 'پایان ماموریت',
  CANCELLED: 'لغو شد',
  ERROR: 'خطای شلیک',
};

export function AppShell({
  children,
  engineState,
  timeSync,
  connected,
  onDisarm,
  footerNote,
  footerAside = 'v2.0 Next.js Ultra HFT | High Precision hrtime & NTP Sync',
}: {
  children: React.ReactNode;
  engineState: SniperState;
  timeSync: TimeSyncStatus | null;
  connected: boolean;
  onDisarm: () => void;
  footerNote: string;
  footerAside?: string;
}) {
  const pathname = usePathname() || '/';
  const hot = isEngineHot(engineState);
  const sample = timeSync?.synchronized === true ? timeSync : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#070b14] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-[1720px] items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-400">
                <Zap className="h-4 w-4 fill-emerald-400" />
                <span
                  className={cn(
                    'absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full',
                    connected ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'
                  )}
                />
              </span>
              <span className="text-[17px] font-black tracking-tight">صف‌شکن</span>
              <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                HFT
              </span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-lg border border-white/6 bg-black/40 p-1 lg:flex">
              {NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-3.5 py-1 text-xs font-semibold',
                      active
                        ? 'border border-emerald-500/30 bg-emerald-500/20 font-bold text-white'
                        : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-[11px] md:flex">
              <span
                className={
                  !connected
                    ? 'font-bold text-rose-400'
                    : hot
                      ? 'font-bold text-amber-400'
                      : 'font-bold text-emerald-400'
                }
              >
                {connected ? STATE_LABEL[engineState] : 'قطع اتصال'}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-slate-500">PING:</span>
              <span className={cn('font-bold', sample ? latencyClass(sample.rttMs) : 'text-slate-400')} dir="ltr">
                {sample ? (
                  <>
                    <Num>{Math.round(sample.rttMs)}</Num> ms
                  </>
                ) : (
                  <Num>—</Num>
                )}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-slate-500">NTP Offset:</span>
              <span className={cn('font-bold', sample ? 'text-cyan-400' : 'text-slate-400')} dir="ltr">
                {sample ? (
                  <>
                    <Num>{formatSignedMs(sample.offsetMs).replace(/ms$/, '')}</Num> ms
                  </>
                ) : (
                  <Num>—</Num>
                )}
              </span>
            </div>
            <HeaderActions />
            {hot ? (
              <Button type="button" variant="destructive" size="sm" onClick={onDisarm}>
                توقف اضطراری
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1720px] flex-1 space-y-4 px-4 py-5 lg:px-8">{children}</main>
      <footer className="border-t border-white/10 bg-[#070b14]/90 px-4 py-3.5 text-[11px] text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-2 sm:flex-row">
          <span>{footerNote}</span>
          <span className="num-mono" dir="ltr">
            {footerAside}
          </span>
        </div>
      </footer>
    </div>
  );
}
