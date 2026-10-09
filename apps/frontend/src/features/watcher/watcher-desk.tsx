'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, type LiveQuote } from '@/lib/api';
import { formatNumber } from '@/lib/format';

export function WatcherDesk({ quotesBySymbol }: { quotesBySymbol: Record<string, LiveQuote> }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [fetched, setFetched] = useState<LiveQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quote = (selected ? quotesBySymbol[selected] : undefined) ?? (fetched?.symbol === selected ? fetched : null);

  useEffect(() => {
    let cancelled = false;
    api.getMarketStatus().then((status) => {
      if (cancelled) return;
      setWatchlist(status.watchlist);
      setError(status.lastError);
      setSelected((current) => current || status.watchlist[0] || '');
    }).catch(() => {
      if (!cancelled) setError('وضعیت دیده‌بان خوانده نشد');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    api.getMarketQuote(selected).then((data) => {
      if (!cancelled && data) setFetched(data);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const flow = quote?.clientFlow;
  const buyVolume = (flow?.buyIndividualVolume ?? 0) + (flow?.buyLegalVolume ?? 0);
  const sellVolume = (flow?.sellIndividualVolume ?? 0) + (flow?.sellLegalVolume ?? 0);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5">
        <h1 className="text-base font-extrabold">تحلیل و دیده‌بان الگوریتمی TSETMC</h1>
        <p className="mt-1 text-[11px] text-slate-400">فقط دادهٔ زنده یا کش سرور. امتیاز ساختگی نمایش داده نمی‌شود.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label className="mb-1 block">جستجوی نماد</Label>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Button
            type="button"
            className="sm:self-end"
            onClick={() => {
              const symbol = query.trim();
              if (!symbol) return;
              api.watchSymbol(symbol).then((res) => {
                setWatchlist(res.watchlist);
                setSelected(symbol);
              });
            }}
          >
            افزودن به دیده‌بان
          </Button>
        </div>
        {error ? <p className="mt-2 text-[11px] text-amber-400">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">{quote?.symbol || selected || 'نمادی انتخاب نشده'}</h2>
            <p className="text-[11px] text-slate-400">{quote?.name || '—'}</p>
          </div>
          <span className="num-mono text-[11px] text-slate-400">{quote?.isin ? `ISIN: ${quote.isin}` : 'ISIN: —'}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="آخرین معامله" value={quote ? formatNumber(quote.lastPrice) : '—'} unit="ریال" />
          <Stat label="قیمت پایانی" value={quote ? formatNumber(quote.closingPrice) : '—'} unit="ریال" />
          <Stat label="حجم معاملات" value={quote ? formatNumber(quote.volume) : '—'} unit="سهم" />
          <Stat label="تغییر" value={quote ? `${quote.changePercent}%` : '—'} unit={quote?.stateTitle || ''} />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5">
        <h2 className="mb-3 text-sm font-bold">پنج مظنهٔ برتر لحظه‌ای</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>حجم خرید</TableHead>
              <TableHead>قیمت خرید</TableHead>
              <TableHead>قیمت فروش</TableHead>
              <TableHead>حجم فروش</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(quote?.orderBook || []).slice(0, 5).map((level) => (
              <TableRow key={level.level}>
                <TableCell className="num-mono">{formatNumber(level.bidVolume)}</TableCell>
                <TableCell className="num-mono text-emerald-400">{formatNumber(level.bidPrice)}</TableCell>
                <TableCell className="num-mono text-rose-400">{formatNumber(level.askPrice)}</TableCell>
                <TableCell className="num-mono">{formatNumber(level.askVolume)}</TableCell>
              </TableRow>
            ))}
            {(quote?.orderBook || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>مظنه‌ای از سرور نرسیده است</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <p className="mt-3 text-[11px] text-slate-400">
          حجم خرید حقیقی/حقوقی: {formatNumber(buyVolume)} — حجم فروش: {formatNumber(sellVolume)}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0f131c]/90 p-5">
        <h2 className="mb-3 text-sm font-bold">دیده‌بان</h2>
        <div className="flex flex-wrap gap-2">
          {watchlist.length === 0 ? <p className="text-xs text-slate-400">فهرست خالی است</p> : null}
          {watchlist.map((symbol) => (
            <div key={symbol} className="flex items-center gap-1">
              <Button type="button" variant={symbol === selected ? 'default' : 'outline'} size="sm" onClick={() => setSelected(symbol)}>
                {symbol}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  api.unwatchSymbol(symbol).then((res) => setWatchlist(res.watchlist));
                }}
              >
                حذف
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/3 p-3">
      <span className="block text-[11px] text-slate-400">{label}</span>
      <span className="num-mono text-lg font-black">{value}</span>
      <span className="ms-1 text-[11px] text-slate-500">{unit}</span>
    </div>
  );
}
