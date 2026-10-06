'use client';

import React from 'react';
import { Play, Square, ShieldCheck, Zap } from 'lucide-react';
import { SniperState } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MasterControlProps {
  engineState: SniperState;
  onArm: () => Promise<void>;
  onDisarm: () => Promise<void>;
  onTestShot: () => Promise<void>;
  antiDoubleSpend: boolean;
  onToggleAntiDoubleSpend: (enabled: boolean) => void;
  loading?: boolean;
}

export function MasterControl({
  engineState,
  onArm,
  onDisarm,
  onTestShot,
  antiDoubleSpend,
  onToggleAntiDoubleSpend,
  loading = false,
}: MasterControlProps) {
  const isArmed = engineState === 'ARMED' || engineState === 'PRE_WARMING' || engineState === 'FIRING';

  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Top Banner / State Note */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isArmed
                ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-ping'
                : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
            }`}
          />
          <span className="text-sm font-black text-foreground">پنل فرماندهی شلیک فوق‌سریع</span>
        </div>

        {/* Anti double-spend checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Checkbox
            checked={antiDoubleSpend}
            onCheckedChange={(checked) => onToggleAntiDoubleSpend(Boolean(checked))}
          />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>حفاظت ضد ارسال تکراری (Anti Double-Spend)</span>
        </label>
      </div>

      {/* Main Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Master Arm */}
        <Button
          type="button"
          disabled={loading || isArmed}
          onClick={onArm}
          size="hero"
          variant={isArmed ? 'armed' : 'default'}
          className={`sm:col-span-2 font-black ${
            isArmed
              ? ''
              : 'shadow-[0_0_35px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)]'
          }`}
        >
          <Play className={`w-5 h-5 fill-current ${isArmed ? 'animate-pulse' : ''}`} />
          <span>
            {isArmed ? 'ربات مسلح است (آماده شلیک در زمان هدف)' : 'مسلح‌سازی موتور سرخطی (ARM)'}
          </span>
        </Button>

        {/* Disarm */}
        <Button
          type="button"
          disabled={loading || !isArmed}
          onClick={onDisarm}
          size="hero"
          variant={isArmed ? 'destructive' : 'secondary'}
          className="text-xs font-bold"
        >
          <Square className="w-4 h-4" />
          <span>لغو آماده‌باش (DISARM)</span>
        </Button>
      </div>

      {/* Secondary Action */}
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || isArmed}
          onClick={onTestShot}
          className="text-xs font-semibold flex items-center gap-2"
        >
          <Zap className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>شلیک تستی فوری (Dry Run)</span>
        </Button>

        <span className="text-[11px] text-muted-foreground">
          وضعیت کنونی: <strong className="text-foreground">{engineState}</strong>
        </span>
      </div>
    </Card>
  );
}
