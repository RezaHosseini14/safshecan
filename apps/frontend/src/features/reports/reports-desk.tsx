'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ShotResult } from '@saf-shekan/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { sanitizeHeadersForDisplay, sanitizeText } from '@/lib/security';

const PAGE_SIZE = 8;

export function ReportsDesk({ liveShots }: { liveShots: ShotResult[] }) {
  const [archived, setArchived] = useState<ShotResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'fast'>('all');
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

  const brokers = [...new Set(shots.map((shot) => shot.broker).filter(Boolean))] as string[];
  const filtered = shots.filter((shot) => {
    if (filter === 'success' && !shot.success) return false;
    if (filter === 'failed' && shot.success) return false;
    if (filter === 'fast' && shot.latencyMs >= 20) return false;
    if (broker !== 'all' && shot.broker !== broker) return false;
    if (query && !`${shot.symbol || ''} ${shot.trackingCode || ''} ${shot.shotIndex}`.includes(query)) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const success = shots.filter((shot) => shot.success);
  const avgLatency = shots.length ? shots.reduce((sum, shot) => sum + shot.latencyMs, 0) / shots.length : 0;
  const ranks = shots.map((shot) => shot.queueRank).filter((rank): rank is number => typeof rank === 'number');
  const bestRank = ranks.length ? Math.min(...ranks) : null;
  const value = shots.reduce((sum, shot) => sum + (shot.orderValueRials || 0), 0);

  const exportCsv = () => {
    const header = ['shot', 'symbol', 'broker', 'latencyMs', 'httpStatus', 'success'];
    const body = filtered.map((shot) =>
      [shot.shotIndex, shot.symbol || '', shot.broker || '', shot.latencyMs, shot.httpStatus, shot.success].join(',')
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
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-black md:text-2xl">کارنامه، آرشیو و تحلیل آماری شلیک‌ها</h1>
          <p className="text-[11px] text-slate-400">بررسی بسته‌های ارسالی به هسته معاملات. راز کارگزاری نمایش داده نمی‌شود.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            چاپ گزارش
          </Button>
          <Button type="button" size="sm" onClick={exportCsv}>
            خروجی اکسل (CSV)
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="درصد موفقیت کلی شلیک‌ها" value={shots.length ? `${Math.round((success.length / shots.length) * 1000) / 10}%` : '—'} hint={`${success.length} / ${shots.length}`} />
        <Stat label="میانگین تاخیر رفت‌وبرگشت" value={shots.length ? formatNumber(avgLatency) : '—'} hint="ms" />
        <Stat label="بهترین رتبه صف کسب‌شده" value={bestRank != null ? `#${bestRank}` : '—'} hint="فقط اگر سرور رتبه بفرستد" />
        <Stat label="مجموع حجم ریالی شلیک‌ها" value={value ? formatNumber(value) : '—'} hint="ریال" />
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'همه شلیک‌ها'],
            ['success', 'شلیک‌های موفق'],
            ['failed', 'خطاهای کارگزاری'],
            ['fast', 'تاخیر زیر ۲۰ میلی‌ثانیه'],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} type="button" size="sm" variant={filter === id ? 'default' : 'outline'} onClick={() => { setFilter(id); setPage(1); }}>
            {label}
          </Button>
        ))}
        <Input className="max-w-48" placeholder="جستجو" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <Select value={broker} onValueChange={(value) => { setBroker(value); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه کارگزاری‌ها</SelectItem>
            {brokers.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شناسه</TableHead>
              <TableHead>نماد</TableHead>
              <TableHead>کارگزاری</TableHead>
              <TableHead>تاخیر</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>پیگیری</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((shot) => (
              <TableRow key={shot.shotIndex}>
                <TableCell className="num-mono">#{shot.shotIndex}</TableCell>
                <TableCell>{shot.symbol || '—'}</TableCell>
                <TableCell>{shot.broker || '—'}</TableCell>
                <TableCell className="num-mono">{shot.latencyMs} ms</TableCell>
                <TableCell>
                  <Badge variant={shot.success ? 'emerald' : 'rose'}>{shot.httpStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setInspected(shot)}>
                    {shot.trackingCode || 'جزئیات'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>شلیکی برای نمایش نیست</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            نمایش {rows.length} از {filtered.length}
          </span>
          <span className="num-mono">
            {page} / {pages}
          </span>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              قبلی
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>
              بعدی
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={inspected != null} onOpenChange={(open) => { if (!open) setInspected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بستهٔ شلیک #{inspected?.shotIndex}</DialogTitle>
            <DialogDescription>هدرهای حساس قبل از نمایش ماسک می‌شوند.</DialogDescription>
          </DialogHeader>
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

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-4">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="num-mono text-xl font-black">{value}</p>
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}
