'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Trash2, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LogEntry, ShotResult } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveTerminalProps {
  logs: LogEntry[];
  shots: ShotResult[];
  onClearLogs: () => void;
}

/**
 * Detects if a string contains any Persian/Arabic script characters.
 */
export const hasPersian = (text: string): boolean => {
  return /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u0750-\u077F\u08A0-\u08FF]/.test(text);
};

/**
 * Regex to split text into Persian segments and non-Persian segments.
 * Matches sequences of Persian words including spaces and attached punctuation.
 */
const PERSIAN_CHUNK_REGEX = /([\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u0750-\u077F\u08A0-\u08FF]+(?:[\s\u200c\u200b.:،؛!؟»«…,%]+[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u0750-\u077F\u08A0-\u08FF]+)*(?:[.:،؛!؟»«…]+)?)/;

/**
 * Formats terminal text such that:
 * - Persian text uses Yekan Bakh (`font-yekan`)
 * - Non-Persian text keeps the current terminal font (`font-mono`)
 */
export function renderTerminalText(text: string): React.ReactNode {
  if (!text) return null;

  // If there is no Persian at all, keep the entire text in the current terminal font (mono)
  if (!hasPersian(text)) {
    return <span className="font-mono">{text}</span>;
  }

  // Split into Persian and non-Persian segments
  const parts = text.split(PERSIAN_CHUNK_REGEX);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (hasPersian(part)) {
          return (
            <span key={index} className="font-yekan tracking-normal" dir="auto">
              {part}
            </span>
          );
        }
        return (
          <span key={index} className="font-mono" dir="ltr">
            {part}
          </span>
        );
      })}
    </>
  );
}

export function LiveTerminal({ logs, shots, onClearLogs }: LiveTerminalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-foreground block font-yekan">ترمینال زنده وقایع و شلیک‌ها</span>
            <span className="text-[10px] text-muted-foreground font-yekan">گزارش لحظه‌ای بسته‌های ارسالی به هسته معاملات</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs"
            title="کپی لاگ‌ها"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-yekan">{copied ? 'کپی شد' : 'کپی'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearLogs}
            className="text-xs hover:text-rose-500 dark:hover:text-rose-300"
            title="پاک‌سازی ترمینال"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-yekan">پاک‌سازی</span>
          </Button>
        </div>
      </div>

      {/* Shot Cards Grid if shots exist */}
      {shots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {shots.slice(0, 10).map((shot) => (
            <div
              key={shot.shotIndex}
              className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                shot.success
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-foreground">
                  <span className="font-yekan">شلیک </span>
                  <span className="font-mono">#{shot.shotIndex}</span>
                </span>
                <span className="font-mono text-muted-foreground">{shot.latencyMs}ms</span>
              </div>
              <div className="flex items-center gap-1">
                {shot.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                )}
                <span className="font-mono text-xs font-bold" dir="ltr">
                  HTTP {shot.httpStatus}
                </span>
              </div>
              {shot.trackingCode && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-300 truncate" title={shot.trackingCode}>
                  <span className="font-yekan">کد: </span>
                  <span className="font-mono">{shot.trackingCode}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Terminal Output */}
      <div
        className="glass-well p-4 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto text-left leading-relaxed max-h-64 overflow-y-auto"
        dir="ltr"
      >
        {logs.map((log) => {
          let colorClass = 'text-slate-700 dark:text-slate-300';
          if (log.level === 'error') colorClass = 'text-rose-600 dark:text-rose-400 font-semibold';
          else if (log.level === 'warn') colorClass = 'text-amber-600 dark:text-amber-400';
          else if (log.level === 'success') colorClass = 'text-emerald-600 dark:text-emerald-400 font-bold';

          return (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-muted-foreground/70 select-none text-[11px] font-mono shrink-0">
                [{renderTerminalText(log.time)}]
              </span>
              <span className={`flex-1 break-all ${colorClass}`}>
                {renderTerminalText(log.text)}
              </span>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-muted-foreground text-center py-6 font-yekan text-xs">
            در انتظار رویداد جدید... با مسلح‌سازی ربات، وقایع شلیک در این قسمت نمایش داده می‌شوند.
          </div>
        )}
      </div>
    </Card>
  );
}
