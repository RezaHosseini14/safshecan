'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Wifi, Zap } from 'lucide-react';
import { Num } from '@/components/num';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { isValidBrokerUrl } from '@/lib/security';

export function NetworkCard({ targetUrl }: { targetUrl: string }) {
  const t = useTranslations('console');
  const tc = useTranslations('common');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);
  const [warm, setWarm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const url = targetUrl && isValidBrokerUrl(targetUrl) ? targetUrl : undefined;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5 backdrop-blur-md">
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-white/6 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
            <Wifi className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold">{t('networkTitle')}</h3>
            <p className="text-[11px] text-slate-400">{t('networkHint')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              api
                .pingBroker(url)
                .then((res) => {
                  setPingMs(res.pingMs);
                  setMessage(null);
                })
                .catch((err: unknown) => setMessage(err instanceof Error ? err.message : t('pingFailed')));
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            {t('pingTest')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              api
                .prewarmBroker(url)
                .then((res) => {
                  setRttMs(res.rttMs);
                  setWarm(res.success);
                  setMessage(res.message);
                })
                .catch((err: unknown) => setMessage(err instanceof Error ? err.message : t('prewarmFailed')));
            }}
          >
            {t('prewarm')}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label={t('tls')} value={warm ? t('prewarmed') : tc('dash')} />
        <Metric label={t('targetUrl')} value={url ? 'https' : t('urlStored')} />
        <Metric label={t('httpPing')} value={pingMs != null ? <><Num>{pingMs}</Num> ms</> : tc('dash')} />
        <Metric label={t('rtt')} value={rttMs != null ? <><Num>{rttMs}</Num> ms</> : tc('dash')} />
      </div>
      {message ? <p className="mt-3 text-[11px] text-slate-400">{message}</p> : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/3 p-3 text-center">
      <span className="mb-1 block text-[11px] text-slate-400">{label}</span>
      <span className="text-xs font-bold text-slate-200">{value}</span>
    </div>
  );
}
