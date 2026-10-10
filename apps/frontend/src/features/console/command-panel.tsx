'use client';

import { useTranslations } from 'next-intl';
import { Play, Zap } from 'lucide-react';
import type { SniperState } from '@saf-shekan/core';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { isEngineHot } from '@/lib/engine-state';

export function CommandPanel({
  engineState,
  antiDoubleSpend,
  loading,
  onToggleAntiDoubleSpend,
  onArm,
  onDisarm,
  onTestShot,
}: {
  engineState: SniperState;
  antiDoubleSpend: boolean;
  loading: boolean;
  onToggleAntiDoubleSpend: (value: boolean) => void;
  onArm: () => void;
  onDisarm: () => void;
  onTestShot: () => void;
}) {
  const t = useTranslations('console');
  const hot = isEngineHot(engineState);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-4 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
          <h2 className="text-sm font-bold">{t('commandTitle')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="anti-double-spend"
            checked={antiDoubleSpend}
            onCheckedChange={(value) => onToggleAntiDoubleSpend(value === true)}
          />
          <Label htmlFor="anti-double-spend">{t('antiDoubleSpend')}</Label>
        </div>
      </div>
      <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <Button type="button" variant="outline" className="h-12 w-full" disabled={loading} onClick={onTestShot}>
            <Zap className="h-4 w-4 text-cyan-400" />
            {t('dryRun')}
          </Button>
        </div>
        <div className="md:col-span-6">
          {hot ? (
            <Button type="button" variant="destructive" className="h-12 w-full text-sm" disabled={loading} onClick={onDisarm}>
              {t('disarm')}
            </Button>
          ) : (
            <Button type="button" className="h-12 w-full text-sm" disabled={loading} onClick={onArm}>
              {t('arm')}
              <Play className="h-5 w-5 fill-current" />
            </Button>
          )}
        </div>
        <div className="text-xs md:col-span-3 md:text-end">
          <div className="text-[11px] text-slate-400">
            {t('currentState')} <span className="font-bold text-amber-400">{engineState}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
