'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { IChartApi, IPriceLine, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CandlestickChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Num } from '@/components/num';
import type { DossierCandle, DossierTrade, LiveQuote, MarketDossier } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const RANGES = [
  { id: 'D' },
  { id: 'M15', minute: '15' },
  { id: 'M5', minute: '5' },
  { id: 'M1', minute: '1' },
  { id: 'tick' },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

const EMPTY_SERIES: DossierCandle[] = [];

function pickRange(candles: MarketDossier['candles'] | null, preferred: RangeId): RangeId {
  if ((candles?.[preferred]?.length ?? 0) > 0) return preferred;
  return RANGES.find((item) => (candles?.[item.id]?.length ?? 0) > 0)?.id ?? preferred;
}

export function WatcherChart({
  quote,
  candles,
  vwap,
  largestTrade,
}: {
  quote: LiveQuote | null;
  candles: MarketDossier['candles'] | null;
  vwap: number | null;
  largestTrade: DossierTrade | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ceilingLineRef = useRef<IPriceLine | null>(null);
  const vwapLineRef = useRef<IPriceLine | null>(null);
  const [ready, setReady] = useState(false);
  const [range, setRange] = useState<RangeId>('M1');
  const activeRange = pickRange(candles, range);
  const series = candles?.[activeRange] ?? EMPTY_SERIES;

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
      const candles = chart.addSeries(lib.CandlestickSeries, {
        upColor: '#4edea3',
        downColor: '#fb7185',
        borderUpColor: '#4edea3',
        borderDownColor: '#fb7185',
        wickUpColor: '#4edea3',
        wickDownColor: '#fb7185',
        priceLineVisible: true,
        lastValueVisible: true,
      });
      const volume = chart.addSeries(lib.HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        color: '#4edea3',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
      });
      chartRef.current = chart;
      seriesRef.current = candles;
      volumeRef.current = volume;
      if (!dead) setReady(true);
    });

    return () => {
      dead = true;
      setReady(false);
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      ceilingLineRef.current = null;
      vwapLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candles = seriesRef.current;
    const volume = volumeRef.current;
    if (!candles || !volume || !ready) return;
    const points = uniquePoints(series);
    candles.setData(points.map(candlePoint));
    volume.setData(points.map((point) => ({
      time: point.time as UTCTimestamp,
      value: point.volume,
      color: point.close >= point.open ? 'rgba(78,222,163,0.55)' : 'rgba(251,113,133,0.55)',
    })));
    replaceLine(candles, ceilingLineRef, quote?.pMax && quote.pMax > 0 ? quote.pMax : null, '#4edea3');
    replaceLine(candles, vwapLineRef, vwap && vwap > 0 ? vwap : null, '#38bdf8');
  }, [series, quote?.pMax, vwap, ready]);

  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  const maxVolume = series.reduce((max, candle) => (candle.volume > max ? candle.volume : max), 0);
  const ceiling = quote?.pMax && quote.pMax > 0 ? quote.pMax : null;
  const labels = axisLabels(series);
  const largestLabel =
    largestTrade != null ? `${formatNumber(largestTrade.price)} / ${formatNumber(largestTrade.volume)}` : null;

  return (
    <section className="glass-card flex flex-col gap-4 rounded-xl p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-white/6 pb-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <CandlestickChart className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-white">{t('chartTitle')}</span>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-white/10 bg-white/4 p-1 text-xs sm:self-auto">
          {RANGES.map((item) => {
            const available = (candles?.[item.id]?.length ?? 0) > 0;
            const active = activeRange === item.id && available;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                size="sm"
                disabled={!available}
                aria-pressed={active}
                title={available ? t('rangeReady') : t('rangeMissing')}
                onClick={() => setRange(item.id)}
                className={cn(
                  'h-7 px-2.5',
                  active
                    ? 'border border-[#4edea3]/30 bg-[#4edea3]/20 font-bold text-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.25)] hover:bg-[#4edea3]/20 hover:text-[#4edea3]'
                    : 'text-slate-500'
                )}
              >
                {'minute' in item ? (
                  <>
                    <Num>{item.minute}</Num>M
                  </>
                ) : item.id === 'tick' ? (
                  t('range.tick')
                ) : (
                  t('range.D')
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <Legend swatch="bg-[#4edea3]" label={t('ceilingRate')} value={ceiling != null ? formatNumber(ceiling) : null} tone="text-[#4edea3]" />
          <Legend swatch="bg-[#38bdf8]" label={t('vwap')} value={vwap != null ? formatNumber(Math.round(vwap)) : null} tone="text-[#38bdf8]" />
          <Legend
            swatch="bg-[#ffb95f]"
            label={largestTrade?.kind === 'normal' ? t('largestNormal') : t('largestBlock')}
            value={largestLabel}
            tone="text-[#ffb95f]"
          />
          <Legend
            swatch="bg-white/40"
            label={t('barVolume')}
            value={maxVolume > 0 ? formatNumber(maxVolume) : null}
            tone="text-slate-400"
          />
        </div>
      </div>

      <div className="relative flex h-[320px] flex-col overflow-hidden rounded-xl border border-white/6 bg-[#05070d]/90 p-3">
        <div ref={hostRef} className="relative z-10 min-h-0 w-full flex-1" />
        {series.length === 0 ? (
          <p className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-xs text-slate-500">
            {t('noSeries')}
          </p>
        ) : null}
        {ceiling != null ? (
          <div className="absolute start-3 top-3 z-20 flex items-center gap-2 rounded-md border border-white/10 bg-black/70 px-2.5 py-1 text-xs text-[#4edea3] backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#4edea3]" />
            <span>
              {t('ceilingLineLead')} <Num>{formatNumber(ceiling)}</Num> {tc('rial')}
              {quote && quote.lastPrice >= ceiling * 0.999 ? ` ${t('queueClosed')}` : ''}
            </span>
          </div>
        ) : null}
        <div className="relative z-20 flex items-center justify-between border-t border-white/6 pt-2 text-xs text-slate-500">
          {labels.length === 0 ? <span>—</span> : null}
          {labels.map((label) => (
            <span key={label}>
              <Num>{label}</Num>
            </span>
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

function candlePoint(candle: DossierCandle) {
  const close = candle.close;
  const open = candle.open > 0 ? candle.open : close;
  const high = Math.max(candle.high > 0 ? candle.high : close, open, close);
  const low = Math.min(candle.low > 0 ? candle.low : close, open, close);
  return { time: candle.time as UTCTimestamp, open, high, low, close };
}

function uniquePoints(candles: DossierCandle[]): DossierCandle[] {
  const byTime = new Map<number, DossierCandle>();
  for (const candle of candles) {
    if (candle.close <= 0) continue;
    byTime.set(candle.time, candle);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

function axisLabels(candles: DossierCandle[]): string[] {
  if (candles.length === 0) return [];
  if (candles.length <= 5) return candles.map((candle) => candle.label);
  const spots = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(ratio * (candles.length - 1)));
  const seen = new Set<number>();
  const labels: string[] = [];
  for (const index of spots) {
    if (seen.has(index)) continue;
    seen.add(index);
    labels.push(candles[index].label);
  }
  return labels;
}

function replaceLine(
  series: ISeriesApi<'Candlestick'>,
  slot: { current: IPriceLine | null },
  price: number | null,
  color: string
) {
  if (slot.current) {
    series.removePriceLine(slot.current);
    slot.current = null;
  }
  if (price == null || price <= 0) return;
  slot.current = series.createPriceLine({
    price,
    color,
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: '',
  });
}
