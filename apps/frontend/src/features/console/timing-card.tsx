'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info, Save, SlidersHorizontal } from 'lucide-react';
import type { BotConfig } from '@saf-shekan/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimingConfigSchema } from '@/lib/security';

export function TimingCard({
  timing,
  onSave,
}: {
  timing: BotConfig['timing'];
  onSave: (timing: BotConfig['timing']) => Promise<void>;
}) {
  const [override, setOverride] = useState<BotConfig['timing'] | null>(null);
  const draft = override ?? timing;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useTranslations('console');

  const fields = [
    { key: 'targetTime' as const, label: t('timing.targetTime'), value: draft.targetTime },
    { key: 'leadTimeMs' as const, label: t('timing.leadTimeMs'), value: String(draft.leadTimeMs) },
    { key: 'burstCount' as const, label: t('timing.burstCount'), value: String(draft.burstCount) },
    { key: 'burstIntervalMs' as const, label: t('timing.burstIntervalMs'), value: String(draft.burstIntervalMs) },
  ];

  return (
    <article className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold">{t('timingTitle')}</h3>
            <p className="text-[11px] text-slate-400">{t('timingHint')}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            const next = {
              ...draft,
              leadTimeMs: Number(draft.leadTimeMs),
              burstCount: Number(draft.burstCount),
              burstIntervalMs: Number(draft.burstIntervalMs),
            };
            const parsed = TimingConfigSchema.safeParse(next);
            if (!parsed.success) {
              setError(t('timingInvalid'));
              return;
            }
            setError(null);
            setBusy(true);
            onSave({ ...timing, ...parsed.data }).finally(() => setBusy(false));
          }}
        >
          <Save className="h-3.5 w-3.5" />
          {t('saveTiming')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {fields.map((field) => (
          <div key={field.key}>
            <Label className="mb-1.5 block text-[11px]">{field.label}</Label>
            <Input
              className="num-mono text-center font-bold"
              dir="ltr"
              value={field.value}
              onChange={(event) => {
                const raw = event.target.value;
                setOverride((current) => ({
                  ...(current ?? timing),
                  [field.key]: field.key === 'targetTime' ? raw : Number(raw),
                }));
              }}
            />
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-400">{error}</p> : null}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-white/6 bg-white/3 p-3 text-[11px] text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        <p>
          <span className="font-bold text-slate-200">{t('formulaLabel')}</span> {t('formulaBefore')}{' '}
          <span className="text-cyan-400" dir="ltr">
            (TargetTime - LeadTime)
          </span>{' '}
          {t('formulaAfter')}
        </p>
      </div>
    </article>
  );
}
