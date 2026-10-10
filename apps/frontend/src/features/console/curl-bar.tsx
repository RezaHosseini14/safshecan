'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { REDACTED_SECRET } from '@/lib/security';

export function CurlBar({
  brokerLabel,
  authReady,
  onParse,
}: {
  brokerLabel: string;
  authReady: boolean;
  onParse: (curl: string) => Promise<void>;
}) {
  const t = useTranslations('console');
  const [open, setOpen] = useState(false);
  const [curl, setCurl] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 px-4 py-3 backdrop-blur-md">
      <button type="button" className="flex w-full items-center justify-between" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-xs font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Terminal className="h-4 w-4" />
          </span>
          {t('curlTitle')}
        </span>
        <span className="flex items-center gap-2">
          <Badge variant={authReady ? 'emerald' : 'amber'}>{authReady ? t('authReady') : t('authPending')}</Badge>
          <Badge>{t('brokerBadge', { label: brokerLabel })}</Badge>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={curl}
            onChange={(event) => setCurl(event.target.value)}
            placeholder={t('curlPlaceholder')}
            dir="ltr"
          />
          <Button
            type="button"
            size="sm"
            disabled={busy || curl.trim().length < 8}
            onClick={() => {
              setBusy(true);
              onParse(curl)
                .then(() => setCurl(''))
                .finally(() => setBusy(false));
            }}
          >
            {t('curlApply')}
          </Button>
          <p className="text-[11px] text-slate-500">
            {t('curlSecretHint', { secret: REDACTED_SECRET })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
