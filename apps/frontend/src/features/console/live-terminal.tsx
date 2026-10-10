'use client';

import { useTranslations } from 'next-intl';
import { Copy, Terminal, Trash2 } from 'lucide-react';
import type { LogEntry } from '@saf-shekan/core';
import { Button } from '@/components/ui/button';
import { sanitizeText } from '@/lib/security';

export function LiveTerminal({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const t = useTranslations('console');
  const tc = useTranslations('common');
  const lines = logs.map((log) => sanitizeText(`${log.time} ${log.text}`));

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
            <Terminal className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold">{t('terminalTitle')}</h3>
            <p className="text-[11px] text-slate-400">{t('terminalHint')}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(lines.join('\n'));
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            {tc('copy')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="h-3.5 w-3.5" />
            {tc('clear')}
          </Button>
        </div>
      </div>
      <div className="min-h-[90px] rounded-lg border border-white/6 bg-[#070b14] p-4 font-mono text-xs text-slate-300" dir="ltr">
        {lines.length === 0 ? (
          <p className="text-center text-slate-400" dir="rtl">
            {t('terminalEmpty')}
          </p>
        ) : (
          lines.map((line, index) => (
            <p key={`${index}-${line.slice(0, 12)}`} className="whitespace-pre-wrap">
              {line}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
