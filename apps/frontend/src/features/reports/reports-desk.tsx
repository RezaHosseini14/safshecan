'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { ShotResult } from '@saf-shekan/core';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Download, Printer, ScrollText, Search } from 'lucide-react';
import { Num } from '@/components/num';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { sanitizeHeadersForDisplay, sanitizeText } from '@/lib/security';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 8;
const RTT_SCALE_MS = 150;

type ShotFilter = 'all' | 'success' | 'failed' | 'fast';
type StatusFilter = 'all' | '200' | 'error';

const FILTERS: { id: ShotFilter; labelKey: 'filter.all' | 'filter.success' | 'filter.failed' | 'filter.fast' }[] = [
  { id: 'all', labelKey: 'filter.all' },
  { id: 'success', labelKey: 'filter.success' },
  { id: 'failed', labelKey: 'filter.failed' },
  { id: 'fast', labelKey: 'filter.fast' },
];

export function ReportsDesk({ liveShots }: { liveShots: ShotResult[] }) {
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const [archived, setArchived] = useState<ShotResult[]>([]);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [broker, setBroker] = useState('all');
  const [page, setPage] = useState(1);
  const [inspected, setInspected] = useState<ShotResult | null>(null);

  useEffect(() => {
    api.getReports().then((res) => setArchived(res.results || [])).catch(() => setArchived([]));
  }, []);

  const shots = useMemo(() => {
    const byIndex = new Map<number, ShotResult>();
    for (const shot of archived) byIndex.set(shot.shotIndex, shot);
    for (const shot of liveShots) byIndex.set(shot.shotIndex, shot);
    return [...byIndex.values()].sort((a, b) => b.shotIndex - a.shotIndex);
  }, [archived, liveShots]);

  const brokers = [...new Set(shots.map((shot) => shot.broker).filter((name): name is string => Boolean(name)))];
  const filtered = shots.filter((shot) => {
    if (filter === 'success' && !shot.success) return false;
    if (filter === 'failed' && shot.success) return false;
    if (filter === 'fast' && shot.latencyMs >= 20) return false;
    if (status === '200' && shot.httpStatus !== 200) return false;
    if (status === 'error' && shot.success && shot.httpStatus < 400) return false;
    if (broker !== 'all' && shot.broker !== broker) return false;
    if (query && !shotHaystack(shot).includes(query.trim())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const success = shots.filter((shot) => shot.success);
  const successRate = shots.length ? (success.length / shots.length) * 100 : null;
  const avgLatency = shots.length ? shots.reduce((sum, shot) => sum + shot.latencyMs, 0) / shots.length : null;
  const slowest = shots.reduce((max, shot) => Math.max(max, shot.latencyMs), 0);
  const rttDelta = avgLatency == null ? null : avgLatency - slowest;
  const best = bestRankedShot(shots);
  const value = shots.reduce((sum, shot) => sum + (shot.orderValueRials || 0), 0);

  const exportCsv = () => {
    const header = ['shot', 'symbol', 'broker', 'firedAt', 'latencyMs', 'httpStatus', 'note'];
    const body = filtered.map((shot) =>
      [
        shot.shotIndex,
        shot.symbol || '',
        shot.broker || '',
        formatShotClock(shot),
        shot.latencyMs,
        shot.httpStatus,
        shot.success ? shot.trackingCode || '' : shot.errorMessage || '',
      ]
        .map(csvCell)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'saf-shekan-shots.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const safeHeaders = sanitizeHeadersForDisplay(inspected?.headers);
  const safeBody = sanitizeText(inspected?.rawResponsePayload || inspected?.errorMessage || '');

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -inset-x-4 -top-6 -z-10 h-[720px] overflow-hidden">
        <div className="absolute -top-36 end-1/4 h-[500px] w-[600px] rounded-full bg-emerald-500/8 blur-[140px]" />
        <div className="absolute top-20 start-1/4 h-[500px] w-[600px] rounded-full bg-cyan-500/8 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">📊</span>
            <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">{t('title')}</h1>
          </div>
          <p className="text-xs text-slate-400">{t('hint')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            className="h-auto bg-emerald-500 px-4 py-2 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            {t('print')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto border-white/10 bg-[#0e1626] px-4 py-2 font-semibold text-slate-200 hover:bg-[#141f36] hover:text-slate-200"
            onClick={exportCsv}
          >
            <Download className="h-4 w-4 text-cyan-400" />
            {t('csv')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('successRate')}>
          <p className="my-2 text-3xl font-extrabold tracking-tight text-emerald-400 md:text-4xl">
            {successRate == null ? <Num>—</Num> : <Num>{successRate.toFixed(1)}%</Num>}
          </p>
          <div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${successRate ?? 0}%` }} />
            </div>
            <p className="text-end text-[11px] text-slate-400">
              {shots.length ? (
                <Num>
                  {success.length} / {shots.length}
                </Num>
              ) : (
                <Num>—</Num>
              )}
            </p>
          </div>
        </KpiCard>

        <KpiCard label={t('avgRtt')}>
          <p className="my-2 flex items-baseline text-cyan-400">
            <span className="text-3xl font-extrabold tracking-tight md:text-4xl">
              <Num>{avgLatency == null ? '—' : avgLatency.toFixed(1)}</Num>
            </span>
            {avgLatency == null ? null : <span className="ms-1.5 font-mono text-lg font-bold">ms</span>}
          </p>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{ width: `${avgLatency == null ? 0 : Math.min(100, (avgLatency / RTT_SCALE_MS) * 100)}%` }}
              />
            </div>
            {rttDelta == null ? null : (
              <p className="text-[11px] font-semibold text-cyan-400">
                <Num>Δ {formatSignedDelta(rttDelta)}</Num>
              </p>
            )}
          </div>
        </KpiCard>

        <KpiCard label={t('bestRank')}>
          <div className="my-1.5 flex items-center justify-between gap-2">
            <p className="text-3xl font-black text-amber-400 md:text-4xl">
              {best ? <Num>#{best.queueRank}</Num> : <Num>—</Num>}
            </p>
            {best?.queueRank === 1 && best.symbol ? (
              <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                {t('frontOfQueue', { symbol: best.symbol })}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-400">
            {best?.queueRank === 1 ? t('rankFirst') : best ? t('rankBest') : t('rankMissing')}
          </p>
        </KpiCard>

        <KpiCard label={t('totalRial')}>
          <p className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              <Num>{shots.length ? formatNumber(value) : '—'}</Num>
            </span>
            {shots.length ? <span className="text-xs text-slate-400">{tc('rial')}</span> : null}
          </p>
          <p className="text-[11px] font-semibold text-emerald-400">
            {shots.length ? (
              <>
                <Num>{success.length}</Num> {t('confirmedTail')}
              </>
            ) : (
              <Num>—</Num>
            )}
          </p>
        </KpiCard>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 pt-1 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={cn(
                  'h-auto rounded-full px-4 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                  active && 'border border-emerald-500/40 bg-emerald-500/20 font-bold text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                )}
                onClick={() => {
                  setFilter(item.id);
                  setPage(1);
                }}
              >
                {t(item.labelKey)}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[260px] flex-1 sm:flex-initial">
            <Input
              className="h-auto border-white/10 bg-[#0e1626] py-2 pl-9 pr-3 placeholder:text-slate-500 focus:border-emerald-500/40"
              placeholder={t('search')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
          </div>
          <Select
            value={broker}
            onValueChange={(value) => {
              setBroker(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-auto w-auto gap-3 border-white/10 bg-[rgba(10,16,28,0.75)] py-2 pr-3 pl-2 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allBrokers')}</SelectItem>
              {brokers.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-auto w-auto gap-3 border-white/10 bg-[rgba(10,16,28,0.75)] py-2 pr-3 pl-2 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="200">{t('statusOk')}</SelectItem>
              <SelectItem value="error">{t('statusError')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
        <Table>
          <TableHeader className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-slate-400">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="px-4 py-3">{t('colId')}</TableHead>
              <TableHead className="px-4 py-3">{t('colSymbol')}</TableHead>
              <TableHead className="px-4 py-3">{t('colBroker')}</TableHead>
              <TableHead className="px-4 py-3">{t('colTime')}</TableHead>
              <TableHead className="px-4 py-3">{t('colLatency')}</TableHead>
              <TableHead className="px-4 py-3">{t('colStatus')}</TableHead>
              <TableHead className="px-4 py-3">{t('colDetail')}</TableHead>
              <TableHead className="px-4 py-3 text-center">{t('colReject')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/[0.04]">
            {rows.map((shot) => (
              <TableRow key={shot.shotIndex} className="border-0 hover:bg-white/[0.02]">
                <TableCell className="px-4 py-3.5 font-bold text-slate-300" dir="ltr">
                  <Num>#{shot.shotIndex}</Num>
                </TableCell>
                <TableCell className="px-4 py-3.5 font-bold text-cyan-400">{shot.symbol || '—'}</TableCell>
                <TableCell className="px-4 py-3.5 text-slate-300">{shot.broker || '—'}</TableCell>
                <TableCell className="px-4 py-3.5 text-slate-300" dir="ltr">
                  <Num>{formatShotClock(shot)}</Num>
                </TableCell>
                <TableCell className={cn('px-4 py-3.5 font-bold', latencyTone(shot.latencyMs))} dir="ltr">
                  <Num>{formatNumber(shot.latencyMs)} ms</Num>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Badge variant={shot.success ? 'emerald' : 'rose'} className="font-mono">
                    <Num>{shot.httpStatus}</Num>
                    {shot.success ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  </Badge>
                </TableCell>
                <TableCell className={cn('px-4 py-3.5', shot.success ? 'text-slate-400' : 'text-[11px] font-medium text-rose-400/90')}>
                  {shot.success ? <Num>{shot.trackingCode || '—'}</Num> : shot.errorMessage || '—'}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    title={t('viewPacket')}
                    onClick={() => setInspected(shot)}
                  >
                    <ScrollText className="h-[18px] w-[18px]" />
                    <span className="sr-only">{t('viewPacket')}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5 text-xs text-slate-400">
          <span>
            {t('pageLead')} <Num>{rows.length}</Num> {t('pageMid')} <Num>{filtered.length}</Num> {t('pageTail')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{tc('previous')}</span>
            </Button>
            <span className="px-2 text-slate-300">
              <Num>
                {safePage} / {pages}
              </Num>
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              disabled={safePage >= pages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{tc('next')}</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={inspected != null} onOpenChange={(open) => { if (!open) setInspected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('packetLead')} <Num>#{inspected?.shotIndex}</Num>
            </DialogTitle>
            <DialogDescription>{t('packetHint')}</DialogDescription>
          </DialogHeader>
          {inspected ? (
            <p className="mb-3 text-xs text-slate-300">
              <span className="font-bold text-cyan-400">{inspected.symbol || '—'}</span>
              <span className="mx-2 text-white/20">|</span>
              {inspected.broker || '—'}
              <span className="mx-2 text-white/20">|</span>
              <Num className={latencyTone(inspected.latencyMs)}>{formatNumber(inspected.latencyMs)} ms</Num>
              <span className="mx-2 text-white/20">|</span>
              <Num>{inspected.httpStatus}</Num>
            </p>
          ) : null}
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px]" dir="ltr">
            {JSON.stringify(safeHeaders, null, 2)}
            {'\n'}
            {safeBody}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="glass-card flex min-h-[145px] flex-col justify-between rounded-2xl p-5">
      <p className="text-xs text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function bestRankedShot(shots: ShotResult[]): ShotResult | null {
  let best: ShotResult | null = null;
  for (const shot of shots) {
    if (typeof shot.queueRank !== 'number') continue;
    if (!best || shot.queueRank < (best.queueRank as number)) best = shot;
  }
  return best;
}

function shotHaystack(shot: ShotResult): string {
  return `${shot.symbol || ''} ${shot.trackingCode || ''} ${shot.shotIndex} ${shot.broker || ''}`;
}

function formatShotClock(shot: ShotResult): string {
  const raw = shot.firedAt ?? shot.timestamp;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${pick('hour')}:${pick('minute')}:${pick('second')}.${pick('fractionalSecond')}`;
}

function formatSignedDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}ms`;
}

function latencyTone(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return 'text-slate-400';
  if (ms < 20) return 'text-cyan-400';
  if (ms < 50) return 'text-sky-400';
  if (ms < 150) return 'text-amber-400';
  return 'text-rose-400';
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}
