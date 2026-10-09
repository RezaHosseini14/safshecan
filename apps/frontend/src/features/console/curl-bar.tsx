'use client';

import { useState } from 'react';
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
          ورود مشخصات از طریق cURL مرورگر
        </span>
        <span className="flex items-center gap-2">
          <Badge variant={authReady ? 'emerald' : 'amber'}>{authReady ? 'AUTH: READY' : 'AUTH: PENDING'}</Badge>
          <Badge>BROKER: {brokerLabel}</Badge>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={curl}
            onChange={(event) => setCurl(event.target.value)}
            placeholder="curl 'https://…' -H 'Authorization: …'"
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
            استخراج و اعمال
          </Button>
          <p className="text-[11px] text-slate-500">
            مقدار {REDACTED_SECRET} در پاسخ سرور یعنی راز روی دیسک مانده و دوباره نمایش داده نمی‌شود.
          </p>
        </div>
      ) : null}
    </section>
  );
}
