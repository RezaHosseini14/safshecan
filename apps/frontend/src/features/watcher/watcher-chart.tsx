'use client';

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, IPriceLine, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CandlestickChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Num } from '@/components/num';
import type { LiveQuote } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const RANGES = ['روزانه', '15M', '5M', '1M', 'Tick'] as const;
const SESSION = ['09:00', '10:00', '11:00', '12:00', '12:30 (پایان بازار)'];

type Sample = { time: number; price: number; volume: number };
type SampleBucket = { symbol: string; samples: Sample[]; key: string };

const EMPTY_SAMPLES: Sample[] = [];

function withQuoteSample(current: SampleBucket, symbol: string, quote: LiveQuote | null): SampleBucket {
  if (!quote || quote.symbol !== symbol || quote.lastPrice <= 0) {
    return current.symbol === symbol ? current : { symbol, samples: EMPTY_SAMPLES, key: '' };
  }
  const key = `${quote.fetchedAt}:${quote.lastPrice}:${quote.volume}`;
  if (current.symbol === symbol && current.key === key) return current;
  const base = current.symbol === symbol ? current.samples : EMPTY_SAMPLES;
  const parsed = Date.parse(quote.fetchedAt);
  const time = Math.floor((Number.isFinite(parsed) ? parsed : Date.now()) / 1000);
  const next = base.slice();
  const last = next[next.length - 1];
  const point = { time, price: quote.lastPrice, volume: quote.volume };
  if (last && last.time === time) next[next.length - 1] = point;
  else next.push(point);
  return { symbol, samples: next.slice(-120), key };
}

export function WatcherChart({ symbol, quote }: { symbol: string; quote: LiveQuote | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const ceilingLineRef = useRef<IPriceLine | null>(null);
  const [bucket, setBucket] = useState<SampleBucket>({ symbol, samples: EMPTY_SAMPLES, key: '' });
  const [ready, setReady] = useState(false);
  const resolved = withQuoteSample(bucket, symbol, quote);
  if (resolved !== bucket) setBucket(resolved);
  const samples = resolved.samples;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dead = false;
    let chart: IChartApi | null = null;

    void import('lightweight-charts').then((lib) => {
      if (dead || !hostRef.current) return;
      chart = lib.createChart(hostRef.current, {
        autoSize: true,
        layout: {
          background: { type: lib.ColorType.Solid, color: '#05070d' },
          textColor: '#9ba6b8',
          fontFamily: 'JetBrains Mono, monospace',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.14)', style: lib.LineStyle.Dashed },
          horzLines: { color: 'rgba(255,255,255,0.14)', style: lib.LineStyle.Dashed },
        },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
        timeScale: { visible: false, borderVisible: false },
        crosshair: {
          vertLine: { color: 'rgba(78,222,163,0.35)' },
          horzLine: { color: 'rgba(78,222,163,0.35)' },
        },
      });
      const series = chart.addSeries(lib.AreaSeries, {
        lineColor: '#4edea3',
        topColor: 'rgba(78, 222, 163, 0.32)',
        bottomColor: 'rgba(78, 222, 163, 0)',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      chartRef.current = chart;
      seriesRef.current = series;
      if (!dead) setReady(true);
    });

    return () => {
      dead = true;
      setReady(false);
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      ceilingLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !ready) return;
    series.setData(samples.map((sample) => ({ time: sample.time as UTCTimestamp, value: sample.price })));
    if (ceilingLineRef.current) {
      series.removePriceLine(ceilingLineRef.current);
      ceilingLineRef.current = null;
    }
    const ceiling = quote?.pMax;
    if (ceiling && ceiling > 0) {
      ceilingLineRef.current = series.createPriceLine({
        price: ceiling,
        color: '#4edea3',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    }
  }, [samples, quote?.pMax, ready]);

  const deltas = volumeDeltas(samples).slice(-9);
  const maxDelta = deltas.reduce((max, value) => (value > max ? value : max), 0);
  const ceiling = quote?.pMax && quote.pMax > 0 ? quote.pMax : null;

  return (
    <section className="glass-card flex flex-col gap-4 rounded-xl p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-white/6 pb-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <CandlestickChart className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-white">تحلیل تکنیکال و جریان نقدینگی دِلتای درون‌روز</span>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-white/10 bg-white/4 p-1 text-xs sm:self-auto">
          {RANGES.map((range) => {
            const active = range === '1M';
            const minute = range.endsWith('M') ? range.slice(0, -1) : null;
            return (
              <Button
                key={range}
                type="button"
                variant="ghost"
                size="sm"
                disabled={!active}
                aria-pressed={active}
                title={active ? 'نمونه‌های زندهٔ همین صفحه' : 'تاریخچهٔ این بازه از سرور نمی‌رسد'}
                className={cn(
                  'h-7 px-2.5',
                  active
                    ? 'border border-[#4edea3]/30 bg-[#4edea3]/20 font-bold text-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.25)] hover:bg-[#4edea3]/20 hover:text-[#4edea3]'
                    : 'text-slate-500'
                )}
              >
                {minute != null ? (
                  <>
                    <Num>{minute}</Num>M
                  </>
                ) : (
                  range
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <Legend swatch="bg-[#4edea3]" label="نرخ سقف" value={ceiling != null ? formatNumber(ceiling) : null} tone="text-[#4edea3]" />
          <Legend swatch="bg-[#38bdf8]" label="VWAP" value={null} tone="text-[#38bdf8]" />
          <Legend swatch="bg-[#ffb95f]" label="اردر بلوکی حقیقی" value={null} tone="text-[#ffb95f]" />
        </div>
      </div>

      <div className="relative flex h-[320px] flex-col overflow-hidden rounded-xl border border-white/6 bg-[#05070d]/90 p-3">
        <div ref={hostRef} className="relative z-10 min-h-0 w-full flex-1" />
        {samples.length === 0 ? (
          <p className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-xs text-slate-500">
            داده‌ای از سرور نرسیده
          </p>
        ) : null}
        {ceiling != null ? (
          <div className="absolute start-3 top-3 z-20 flex items-center gap-2 rounded-md border border-white/10 bg-black/70 px-2.5 py-1 text-xs text-[#4edea3] backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#4edea3]" />
            <span>
              سقف مجاز: <Num>{formatNumber(ceiling)}</Num> ریال
              {quote && quote.lastPrice >= ceiling * 0.999 ? ' (صف بسته)' : ''}
            </span>
          </div>
        ) : null}
        <div className="relative z-20 flex items-center justify-between border-t border-white/6 pt-2 text-xs text-slate-500">
          {SESSION.map((label) => (
            <span key={label} className={label.startsWith('12:30') ? 'font-bold text-[#4edea3]' : undefined}>
              <Num>{label.slice(0, 5)}</Num>
              {label.slice(5)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-white/5 bg-[#05070d]/60 p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>حجم تجمیعی نوسان‌گیری (Volume Delta)</span>
          <span>
            Max: <Num className="font-bold text-[#4edea3]">{maxDelta > 0 ? formatNumber(maxDelta) : '—'}</Num>
          </span>
        </div>
        <div className="flex h-10 w-full items-end gap-1.5 pt-1">
          {deltas.length === 0 ? <span className="text-[11px] text-slate-500">—</span> : null}
          {deltas.map((delta, index) => (
            <span
              key={`${index}-${delta}`}
              className="flex-1 rounded-t bg-[#4edea3]"
              style={{ height: `${Math.max(8, (delta / maxDelta) * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Legend({ swatch, label, value, tone }: { swatch: string; label: string; value: string | null; tone: string }) {
  return (
    <span className={cn('flex items-center gap-1.5', tone)}>
      <span className={cn('inline-block h-0.5 w-3 rounded-full', swatch)} />
      <span>
        {label}: {value != null ? <Num>{value}</Num> : '—'}
      </span>
    </span>
  );
}

function volumeDeltas(samples: Sample[]): number[] {
  if (samples.length === 0) return [];
  if (samples.length === 1) return [samples[0].volume];
  const deltas: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    deltas.push(Math.max(0, samples[index].volume - samples[index - 1].volume));
  }
  return deltas;
}
