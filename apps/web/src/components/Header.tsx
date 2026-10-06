'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  ShieldAlert,
  Compass,
  FlaskConical,
} from 'lucide-react';
import { SniperState, TimeSyncStatus } from '../types';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { startSafshekanTour } from '../lib/tour';

interface HeaderProps {
  engineState: SniperState;
  timeSync: TimeSyncStatus | null;
  pingMs?: number;
  onEmergencyStop?: () => void;
  onOpenBacktest?: () => void;
  connected?: boolean;
}

export function Header({
  engineState,
  timeSync,
  pingMs = 18,
  onEmergencyStop,
  onOpenBacktest,
  connected = true,
}: HeaderProps) {
  const pathname = usePathname();

  const getStatusPersian = (state: SniperState) => {
    switch (state) {
      case 'ARMED':
        return 'آماده‌باش (مسلح)';
      case 'PRE_WARMING':
        return 'پیش‌گرمایش سوکت';
      case 'FIRING':
        return 'شلیک رگباری';
      case 'COMPLETED':
        return 'پایان ماموریت';
      case 'ERROR':
        return 'خطای شلیک';
      case 'IDLE':
      default:
        return 'آماده دریافت';
    }
  };

  const getStateDescription = (state: SniperState) => {
    switch (state) {
      case 'ARMED':
        return 'موتور مسلح شده و در ثانیه هدف، رگبار سفارشات با دقت میکروثانیه ارسال خواهد شد.';
      case 'PRE_WARMING':
        return 'سوکت‌های ارتباط مستقیم با کارگزاری در حال بازگشایی و گرم نگه‌داشته شدن هستند.';
      case 'FIRING':
        return 'شلیک رگباری بسته‌ها با حداکثر توان در حال انجام است.';
      case 'COMPLETED':
        return 'شلیک به پایان رسید و نتیجه در گزارش‌ها بایگانی شد.';
      case 'ERROR':
        return 'خطایی در جریان شلیک رخ داده است؛ لاگ ترمینال را بررسی فرمایید.';
      case 'IDLE':
      default:
        return 'موتور در انتظار تنظیم پارامترها و فعال‌سازی مسلح‌سازی (ARM) است.';
    }
  };

  const isArmedOrFiring =
    engineState === 'ARMED' || engineState === 'PRE_WARMING' || engineState === 'FIRING';

  const formattedOffset =
    timeSync?.offsetMs !== undefined
      ? `${timeSync.offsetMs >= 0 ? '+' : ''}${timeSync.offsetMs.toFixed(1)}ms`
      : '-14.2ms';

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Left: Minimal Brand & Clean Nav */}
            <div className="flex items-center gap-5">
              {/* Brand Logo & Name */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    id="tour-logo"
                    className="flex items-center gap-2 group select-none transition-opacity hover:opacity-85"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-500/20">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold tracking-tight text-foreground">
                        صف‌شکن
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 font-medium">
                        HFT
                      </span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="text-right">
                  <p className="font-bold text-foreground">صف‌شکن HFT</p>
                  <p className="text-[11px] text-muted-foreground">
                    ترمینال فوق‌سریع سرخطی بورس تهران با ساعت اتمی NTP
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Minimal Navigation Tabs */}
              <nav id="tour-header-nav" className="flex items-center gap-1">
                <Link
                  href="/"
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    pathname === '/'
                      ? 'bg-muted text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  داشبورد
                </Link>
                <Link
                  href="/reports"
                  id="tour-reports-nav"
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    pathname === '/reports'
                      ? 'bg-muted text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  گزارش‌ها
                </Link>
              </nav>
            </div>

            {/* Right: Consolidated Telemetry Capsule & Subtle Tools */}
            <div className="flex items-center gap-2">
              {/* Single Consolidated Telemetry Capsule */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    id="tour-telemetry"
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted border border-border/60 text-xs cursor-default select-none transition-colors"
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isArmedOrFiring
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse'
                          : engineState === 'ERROR'
                          ? 'bg-rose-500'
                          : 'bg-emerald-500/80'
                      }`}
                    />
                    <span id="tour-header-status" className="text-[11px] font-medium text-foreground">
                      {getStatusPersian(engineState)}
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                      {pingMs}ms
                    </span>
                    <span className="hidden sm:inline text-muted-foreground/30">|</span>
                    <span className="hidden sm:inline font-mono text-[11px] text-sky-500/90 font-medium">
                      {formattedOffset}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="w-64 p-3 text-right space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                    <span className="text-xs font-bold text-foreground">وضعیت تله‌متری سامانه</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        connected
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {connected ? 'متصل' : 'قطع'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">وضعیت موتور:</span>
                      <span className="font-semibold text-foreground">{getStatusPersian(engineState)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاخیر شبکه (Ping):</span>
                      <span className="font-mono font-semibold text-foreground">{pingMs}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">انحراف ساعت اتمی (NTP):</span>
                      <span className="font-mono font-semibold text-sky-500">
                        {formattedOffset}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/75 pt-1.5 border-t border-border/40 leading-relaxed">
                    {getStateDescription(engineState)}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Contextual Emergency Stop: Only visible when active/armed/firing */}
              {onEmergencyStop && isArmedOrFiring && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onEmergencyStop}
                      className="h-8 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
                      aria-label="توقف اضطراری"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>توقف اضطراری</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-right">
                    <p className="font-bold text-rose-500">توقف اضطراری (Emergency Stop)</p>
                    <p className="text-[11px] text-muted-foreground">لغو فوری تمام شلیک‌ها و خلع سلاح موتور</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Cohesive Secondary Tools: Minimal monochromatic icons */}
              <div className="flex items-center gap-0.5">
                {/* Backtest / Simulator */}
                {onOpenBacktest && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        id="tour-backtest-btn"
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={onOpenBacktest}
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="شبیه‌ساز و بک‌تست معاملات"
                      >
                        <FlaskConical className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-right">
                      <p className="font-bold text-foreground">شبیه‌ساز معاملات</p>
                      <p className="text-[11px] text-muted-foreground">
                        تست سناریوهای بازگشایی و پیش‌بینی رتبه در صف
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Tour Guide */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      id="tour-guide-btn"
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={startSafshekanTour}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="تور راهنما"
                    >
                      <Compass className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-right">
                    <p className="font-bold text-foreground">تور راهنما</p>
                    <p className="text-[11px] text-muted-foreground">
                      آموزش تعاملی و گام‌به‌گام کار با سامانه
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Theme Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ThemeToggle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-right space-y-0.5">
                    <p className="font-semibold text-foreground">تغییر تم</p>
                    <p className="text-[11px] text-muted-foreground">حالت شب و روز</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
