'use client';

import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { TimingConfig } from '../types';
import { TimingConfigSchema } from '../lib/security';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EngineSettingsProps {
  timing: TimingConfig;
  onSaveTiming: (timing: TimingConfig) => Promise<void>;
}

export function EngineSettings({ timing, onSaveTiming }: EngineSettingsProps) {
  const [formData, setFormData] = useState<TimingConfig>(timing);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (field: keyof TimingConfig, val: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof timing[field] === 'number' ? Number(val) : val,
    }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = TimingConfigSchema.safeParse(formData);
    if (!result.success) {
      setErrorMsg(result.error.errors[0]?.message || 'تنظیمات نامعتبر است');
      return;
    }

    setSaving(true);
    try {
      await onSaveTiming(formData);
      setSuccessMsg('تنظیمات موتور سرخطی با موفقیت ذخیره شد.');
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-500 dark:text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-foreground block">تنظیمات موتور شلیک و تایمینگ</span>
            <span className="text-[10px] text-muted-foreground">تنظیم پارامترهای میلی‌ثانیه‌ای و تعداد شلیک‌ها</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="font-bold text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Target Time */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="whitespace-nowrap font-bold text-xs text-foreground">
              زمان هدف بازگشایی
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 dark:bg-card/60 px-1.5 py-0.5 rounded border border-border/40">
              Target Time
            </span>
          </div>
          <Input
            type="text"
            value={formData.targetTime}
            onChange={(e) => handleChange('targetTime', e.target.value)}
            placeholder="08:45:00.000"
            className="font-mono font-bold text-right h-10"
          />
        </div>

        {/* Lead Time (ms) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="whitespace-nowrap font-bold text-xs text-foreground">
              لیدتایم تاخیر شبکه
            </Label>
            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">
              ms
            </span>
          </div>
          <Input
            type="number"
            value={formData.leadTimeMs}
            onChange={(e) => handleChange('leadTimeMs', e.target.value)}
            className="text-sky-600 dark:text-sky-400 font-mono font-bold text-right h-10"
          />
        </div>

        {/* Burst Count */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="whitespace-nowrap font-bold text-xs text-foreground">
              تعداد شلیک رگباری
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 dark:bg-card/60 px-1.5 py-0.5 rounded border border-border/40 font-semibold">
              Burst Count
            </span>
          </div>
          <Input
            type="number"
            value={formData.burstCount}
            onChange={(e) => handleChange('burstCount', e.target.value)}
            min={1}
            max={30}
            className="font-mono font-bold text-right h-10"
          />
        </div>

        {/* Burst Interval (ms) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="whitespace-nowrap font-bold text-xs text-foreground">
              فاصله بین شلیک‌ها
            </Label>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 dark:bg-card/60 px-1.5 py-0.5 rounded border border-border/40 font-semibold">
              Interval (ms)
            </span>
          </div>
          <Input
            type="number"
            step="0.5"
            value={formData.burstIntervalMs}
            onChange={(e) => handleChange('burstIntervalMs', e.target.value)}
            min={0.5}
            className="font-mono font-bold text-right h-10"
          />
        </div>
      </div>

      {/* Info tooltip */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
        <span>
          فرمول شلیک: سفارش اول در لحظه{' '}
          <strong className="text-foreground">
            (TargetTime - LeadTime)
          </strong>{' '}
          ارسال شده و شلیک‌های بعدی با فاصله مشخص‌شده تکرار می‌شوند تا بهترین رتبه صف ثبت شود.
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </Card>
  );
}
