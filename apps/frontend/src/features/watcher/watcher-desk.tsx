'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { SymbolItem } from '@saf-shekan/core';
import {
  ArrowLeftRight,
  Bell,
  CheckCircle2,
  CircleDashed,
  BarChart3,
  List,
  PieChart,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Volume2,
  Wallet,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SymbolPicker } from '@/components/symbol-picker';
import { Num } from '@/components/num';
import { api, type LiveQuote } from '@/lib/api';
import { formatNumber, tomanFromRial } from '@/lib/format';
import { cn } from '@/lib/utils';
import { WatcherChart } from '@/features/watcher/watcher-chart';
import {
  actionCopy,
  atCeiling,
  buyerPower,
  closingChangePercent,
  formatPct,
  matchesFilter,
  netIndividualVolume,
  perCapitaBuyToman,
  priceBand,
  queueStats,
  summaryCopy,
  suspiciousMultiple,
  type WatcherFilter,
} from '@/features/watcher/watcher-metrics';

const FILTERS: { id: WatcherFilter; label: string; icon: typeof TrendingUp }[] = [
  { id: 'growth', label: 'مستعد رشد و جهش قیمتی', icon: TrendingUp },
  { id: 'flow', label: 'ورود پول هوشمند', icon: Zap },
  { id: 'block', label: 'اردر ترس و کد به کد', icon: ArrowLeftRight },
  { id: 'light-queue', label: 'صف‌های سبک در جهش', icon: Rocket },
];

const SEARCH_ID = 'ticker-search-input';

export function WatcherDesk({ quotesBySymbol }: { quotesBySymbol: Record<string, LiveQuote> }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuotes, setLocalQuotes] = useState<Record<string, LiveQuote>>({});
  const [metaBySymbol, setMetaBySymbol] = useState<Record<string, SymbolItem>>({});
  const [filter, setFilter] = useState<WatcherFilter | null>('growth');
  const [notedAlert, setNotedAlert] = useState<string | null>(null);
  const [summaryLarge, setSummaryLarge] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById(SEARCH_ID)?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) return;
    let cancelled = false;
    void Promise.all(
      watchlist.map(async (symbol) => {
        const [quote, items] = await Promise.all([
          api.getMarketQuote(symbol),
          api.searchSymbols(symbol, 8),
        ]);
        return { symbol, quote, item: items.find((entry) => entry.symbol === symbol) ?? null };
      })
    ).then((rows) => {
      if (cancelled) return;
      setLocalQuotes((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (row.quote) next[row.symbol] = row.quote;
        }
        return next;
      });
      setMetaBySymbol((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (row.item) next[row.symbol] = row.item;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [watchlist]);

  const quoteFor = (symbol: string) => quotesBySymbol[symbol] ?? localQuotes[symbol] ?? null;
  const quote = selected ? quoteFor(selected) : null;
  const meta = selected ? metaBySymbol[selected] ?? null : null;
  const power = buyerPower(quote);
  const multiple = suspiciousMultiple(quote, meta);
  const book = queueStats(quote?.orderBook ?? []);
  const band = quote ? priceBand(quote) : null;
  const locked = quote ? atCeiling(quote) : false;
  const visible = watchlist.filter((symbol) => matchesFilter(filter, quoteFor(symbol)));
  const summary = summaryCopy(quote?.symbol || selected, quote, power);

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -inset-x-4 -top-6 -z-10 h-[720px] overflow-hidden">
        <div className="absolute -top-40 end-1/4 h-[500px] w-[600px] rounded-full bg-[#4edea3]/4 blur-[160px]" />
        <div className="absolute top-20 start-1/4 h-[450px] w-[550px] rounded-full bg-[#38bdf8]/4 blur-[170px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <section className="glass-card flex flex-col gap-4 rounded-xl p-5">
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-white/6 pb-3.5 lg:flex-row lg:items-center">
          <SymbolPicker
            variant="field"
            inputId={SEARCH_ID}
            value={query}
            open={searchOpen}
            onOpenChange={setSearchOpen}
            onQueryChange={setQuery}
            onSelect={(item) => {
              setQuery(item.symbol);
              setMetaBySymbol((current) => ({ ...current, [item.symbol]: item }));
              void api.watchSymbol(item.symbol).then((res) => {
                setWatchlist(res.watchlist);
                setSelected(item.symbol);
              });
            }}
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs lg:pb-0">
            {FILTERS.map((item) => {
              const Icon = item.icon;
              const active = filter === item.id;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setFilter((current) => (current === item.id ? null : item.id))}
                  className={cn(
                    'h-8 shrink-0 gap-1.5 rounded-lg px-3',
                    active
                      ? 'border border-[#4edea3]/30 bg-[#4edea3]/15 font-bold text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)] hover:bg-[#4edea3]/25 hover:text-[#4edea3]'
                      : 'border border-white/6 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
        {error ? <p className="text-[11px] text-amber-400">{error}</p> : null}
        {quote?.warning ? <p className="text-[11px] text-amber-400">{quote.warning}</p> : null}

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col justify-between gap-4 border-b border-white/6 pb-3 md:flex-row md:items-center">
            <div className="flex shrink-0 items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#4edea3]/35 bg-gradient-to-br from-[#4edea3]/25 to-[#4edea3]/5 shadow-[0_0_15px_rgba(78,222,163,0.25)]">
                <span className="text-[20px] font-black tracking-tight text-[#4edea3]">{quote?.symbol || selected || '—'}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-white">{quote?.name || meta?.name || 'نمادی انتخاب نشده'}</h1>
                  {meta?.group ? (
                    <Badge variant="cyan" className="rounded px-2 py-0.5 text-[10px]">
                      {meta.group}
                    </Badge>
                  ) : (
                    <Badge variant="muted" className="rounded px-2 py-0.5 text-[10px]">صنعت: —</Badge>
                  )}
                  <Badge variant="emerald" className="rounded px-2 py-0.5 text-[11px] shadow-[0_0_8px_rgba(78,222,163,0.15)]">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#4edea3]" />
                    {locked ? 'قفل صف خرید' : quote?.stateTitle || '—'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded border border-white/6 bg-white/4 px-1.5 py-0.5 text-slate-400" dir="ltr">
                    ISIN: <Num>{quote?.isin || meta?.isin || '—'}</Num>
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-slate-400">{meta?.market || '—'}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-slate-400">
                    دامنه: <span className="font-bold text-[#ffb95f]">{band ? withFigures(band) : <Num>—</Num>}</span>
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-slate-400">
                    حجم مبنا: <Num className="font-bold text-[#4edea3]">{meta?.baseVolume != null ? formatNumber(meta.baseVolume) : '—'}</Num>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 self-start md:self-auto">
              <Button
                type="button"
                size="sm"
                className="h-9 bg-[#4edea3] px-4 text-[#002b1b] shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:bg-[#6ffbbe]"
                disabled={!selected && !query}
                onClick={() => {
                  const symbol = selected || query;
                  if (!symbol) return;
                  void api.watchSymbol(symbol).then((res) => {
                    setWatchlist(res.watchlist);
                    setSelected(symbol);
                  });
                }}
              >
                <Star className="h-4 w-4 fill-current" />
                افزودن به دیده‌بان
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-4"
                aria-pressed={notedAlert === selected && selected !== ''}
                disabled={!selected}
                onClick={() => setNotedAlert((current) => (current === selected ? null : selected))}
              >
                <Bell className="h-4 w-4 text-[#ffb95f]" />
                هشدار هوشمند
              </Button>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard
              label="آخرین معامله"
              icon={<Wallet className="h-4 w-4 text-[#4edea3]" />}
              value={quote ? formatNumber(quote.lastPrice) : null}
              unit="ریال"
              badge={quote ? renderPct(quote.changePercent) : null}
              accent
            />
            <MetricCard
              label="قیمت پایانی"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              value={quote ? formatNumber(quote.closingPrice) : null}
              unit="ریال"
              badge={quote ? renderPct(closingChangePercent(quote)) : null}
            />
            <MetricCard
              label="حجم معاملات"
              icon={<BarChart3 className="h-4 w-4 text-[#38bdf8]" />}
              value={quote ? formatNumber(quote.volume) : null}
              unit="سهم"
              badge={multiple != null ? <><Num>{multiple.toFixed(1)}</Num>x مبنا</> : null}
              badgeTone="text-[#ffb95f]"
              valueTone="text-[#38bdf8]"
            />
            <MetricCard
              label="نسبت P/E (TTM)"
              icon={<PieChart className="h-4 w-4 text-[#4edea3]" />}
              value={null}
              unit="مرتبه"
              badge="گروه: —"
            />
            <MetricCard
              label="سهام شناور آزاد"
              icon={<CircleDashed className="h-4 w-4 text-[#ffb95f]" />}
              value={null}
              unit="شناوری"
              badge={null}
              valueTone="text-[#ffb95f]"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-3">
          <OrderBookCard quote={quote} locked={locked} book={book} />
          <TapeCard />
        </div>
        <div className="xl:col-span-5">
          <WatcherChart symbol={selected} quote={quote} />
        </div>
        <div className="xl:col-span-4">
          <AnalysisCard quote={quote} meta={meta} power={power} multiple={multiple} />
        </div>
      </div>

      <SummaryCard
        symbol={quote?.symbol || selected}
        summary={summary}
        action={actionCopy(quote)}
        large={summaryLarge}
        onToggleSize={() => setSummaryLarge((current) => !current)}
        onSpeak={() => speak(summary)}
      />

      <WatchlistTable
        symbols={visible}
        selected={selected}
        emptyBecause={watchlist.length === 0 ? 'empty' : filter === 'block' ? 'block' : visible.length === 0 ? 'filter' : null}
        quoteFor={quoteFor}
        metaBySymbol={metaBySymbol}
        onSelect={setSelected}
      />
    </div>
  );
}

function MetricCard({
  label,
  icon,
  value,
  unit,
  badge,
  accent,
  badgeTone = 'text-[#4edea3]',
  valueTone = 'text-white',
  className,
}: {
  label: string;
  icon: ReactNode;
  value: string | null;
  unit: string;
  badge: ReactNode | null;
  accent?: boolean;
  badgeTone?: string;
  valueTone?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-1.5 rounded-xl border bg-[#111624]/60 p-3',
        accent ? 'border-[#4edea3]/30 shadow-[0_0_12px_rgba(78,222,163,0.15)]' : 'border-white/7',
        className
      )}
    >
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>{label}</span>
        {icon}
      </div>
      <Num className={cn('text-base font-black tracking-tight', accent ? 'text-[#4edea3]' : valueTone)}>{value ?? '—'}</Num>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10px] text-slate-500">{unit}</span>
        <span className={cn('rounded border border-white/10 bg-white/4 px-1.5 py-0.5 text-[10px] font-bold', badgeTone)}>
          {badge ?? '—'}
        </span>
      </div>
    </div>
  );
}

function OrderBookCard({
  quote,
  locked,
  book,
}: {
  quote: LiveQuote | null;
  locked: boolean;
  book: ReturnType<typeof queueStats>;
}) {
  const levels = (quote?.orderBook ?? []).slice(0, 5);
  return (
    <section className="glass-card flex flex-col gap-3.5 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/10 text-[#38bdf8]">
            <List className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-white"><Num>5</Num> مظنه برتر لحظه‌ای</span>
        </div>
        <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-2 py-0.5 text-[11px] font-bold text-[#4edea3]">
          {locked ? 'قفل سقف' : quote?.stateTitle || '—'}
        </span>
      </div>
      <div className="grid grid-cols-12 border-b border-white/5 pb-2 text-center text-[10px] text-slate-500">
        <span className="col-span-2">تعداد</span>
        <span className="col-span-4">حجم خرید</span>
        <span className="col-span-3">قیمت خرید</span>
        <span className="col-span-3">فروش</span>
      </div>
      <div className="space-y-1.5 text-xs">
        {levels.length === 0 ? <p className="py-3 text-center text-slate-500">مظنه‌ای از سرور نرسیده است</p> : null}
        {levels.map((level) => {
          const width = book.maxBid > 0 ? Math.max(4, (level.bidVolume / book.maxBid) * 100) : 0;
          return (
            <div key={level.level} className="relative grid grid-cols-12 items-center overflow-hidden rounded-lg border border-white/3 bg-[#05070d]/80 px-1.5 py-2 text-center">
              <div className="pointer-events-none absolute inset-y-0 end-0 bg-[#4edea3]/15" style={{ width: `${width}%` }} />
              <Num className="relative z-10 col-span-2 text-slate-500">{formatNumber(level.bidOrders)}</Num>
              <Num className="relative z-10 col-span-4 font-bold text-[#4edea3]">{formatNumber(level.bidVolume)}</Num>
              <Num className="relative z-10 col-span-3 font-black text-[#4edea3]">{formatNumber(level.bidPrice)}</Num>
              <span className="relative z-10 col-span-3 text-slate-500">
                {level.askPrice > 0 ? <Num>{formatNumber(level.askPrice)}</Num> : <Num>—</Num>}
                /<Num>{formatNumber(level.askVolume)}</Num>
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-white/6 bg-black/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">ارزش کل صف خرید:</span>
          <span className="text-xs font-black text-[#4edea3]">
            {book.bidValue > 0 ? (
              <>
                <Num>{formatNumber(book.bidValue)}</Num> IRR (~ <Num>{formatNumber(tomanFromRial(book.bidValue))}</Num> تومان)
              </>
            ) : (
              <Num>—</Num>
            )}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.7)]" style={{ width: `${book.bidShare * 100}%` }} />
        </div>
        <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
          <span>
            خریدار: <Num className="font-bold text-[#4edea3]">{formatNumber(book.buyers)}</Num>
          </span>
          <span className="text-emerald-400">
            عرضه: <Num className="font-bold">{formatNumber(book.offers)}</Num>
          </span>
        </div>
      </div>
    </section>
  );
}

function TapeCard() {
  return (
    <section className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <List className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-white">تیپ معاملات درشت و کد به کد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-1.5 py-0.5 text-[10px] text-[#4edea3]/80">زنده</span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
        </div>
      </div>
      <p className="rounded-lg border border-white/4 bg-[#05070d]/60 p-2 text-[11px] text-slate-500">—</p>
    </section>
  );
}

function AnalysisCard({
  quote,
  meta,
  power,
  multiple,
}: {
  quote: LiveQuote | null;
  meta: SymbolItem | null;
  power: number | null;
  multiple: number | null;
}) {
  const perCapita = perCapitaBuyToman(quote);
  const net = netIndividualVolume(quote);
  return (
    <section className="glass-card relative flex flex-col gap-4 overflow-hidden rounded-xl p-5">
      <div className="pointer-events-none absolute -start-12 -top-12 h-36 w-36 rounded-full bg-[#4edea3]/10 blur-2xl" />
      <div className="flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold text-white">موتور هوش مصنوعی تحلیل و ارزیابی سهم (AI Stock Analysis)</span>
        </div>
        <span className="rounded border border-[#4edea3]/25 bg-[#4edea3]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#4edea3]" dir="ltr">
          AI v<Num>2.4</Num>
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#4edea3]/25 bg-[#05070d]/80 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">سیگنال تجمیعی بنیادی و تکنیکال:</span>
          <span className="text-sm font-black text-[#4edea3]">{quote?.stateTitle || '—'}</span>
          <span className="text-xs leading-relaxed text-slate-400">
            {power != null ? (
              <>
                نسبت خرید حقیقی به فروش حقیقی <Num>{power.toFixed(2)}</Num>
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#4edea3]/40 bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.3)]">
          <Num className="text-base font-black text-[#4edea3]">—</Num>
          <span className="-mt-0.5 text-[9px] text-slate-500">اطمینان</span>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#38bdf8]/20 bg-[#111624]/60 p-2.5 text-xs">
        <div className="flex shrink-0 items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-[#38bdf8]" />
          <span className="font-semibold text-slate-100">وضعیت تکنیکال:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-[#4edea3]/25 bg-[#4edea3]/15 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#4edea3]">
            {quote?.stateTitle || '—'}
          </span>
          <span className="text-[11px] font-bold text-[#38bdf8]">
            RSI: <Num>—</Num>
          </span>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <QuantRow label="خالص ورود نقدینگی هوشمند:">
          {net != null ? (
            <>
              <Num>{formatNumber(net)}</Num> سهم
            </>
          ) : (
            <Num>—</Num>
          )}
        </QuantRow>
        <QuantRow label="نسبت قدرت خریدار به فروشنده:">
          {power != null ? (
            <>
              <Num>{power.toFixed(2)}</Num> x
            </>
          ) : (
            <Num>—</Num>
          )}
        </QuantRow>
        <QuantRow label="سرانه خرید حقیقی:" tone="text-[#38bdf8]">
          {perCapita != null ? (
            <>
              <Num>{formatNumber(perCapita)}</Num> تومان
            </>
          ) : (
            <Num>—</Num>
          )}
        </QuantRow>
        <QuantRow label="حجم مشکوک نسبت به ماه:" tone="text-[#ffb95f]">
          {multiple != null ? (
            <>
              <Num>{multiple.toFixed(1)}</Num>x حجم مبنا
            </>
          ) : (
            <Num>—</Num>
          )}
        </QuantRow>
        <QuantRow label="وضعیت شناوری و عرضه حقوقی:">
          {meta?.baseVolume != null ? (
            <>
              حجم مبنا <Num>{formatNumber(meta.baseVolume)}</Num>
            </>
          ) : (
            <Num>—</Num>
          )}
        </QuantRow>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <TargetBox label="حد ضرر (SL)" tone="border-rose-500/20 text-rose-400" />
        <TargetBox label="هدف اول (TP1)" tone="border-[#38bdf8]/20 text-[#38bdf8]" />
        <TargetBox label="ریسک به ریوارد" tone="border-[#4edea3]/20 text-[#4edea3]" />
      </div>
    </section>
  );
}

function QuantRow({ label, children, tone = 'text-[#4edea3]' }: { label: string; children: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/4 bg-[#05070d]/60 p-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn('text-xs font-bold', tone)}>{children}</span>
    </div>
  );
}

function TargetBox({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={cn('flex flex-col rounded-lg border bg-black/40 p-2.5', tone)}>
      <span className="text-[10px] text-slate-500">{label}</span>
      <Num className="mt-0.5 text-xs font-bold">—</Num>
      <span className="text-[10px] opacity-70">—</span>
    </div>
  );
}

function SummaryCard({
  symbol,
  summary,
  action,
  large,
  onToggleSize,
  onSpeak,
}: {
  symbol: string;
  summary: string;
  action: string;
  large: boolean;
  onToggleSize: () => void;
  onSpeak: () => void;
}) {
  return (
    <section className="glass-card flex w-full flex-col gap-4 rounded-xl border border-[#4edea3]/30 bg-[#0c121e]/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              جمع‌بندی سهم به زبان کاملاً ساده
              <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4edea3]">
                {symbol || '—'}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">ویژه مطالعه سریع و تصمیم‌گیری شفاف سهامداران محترم (بدون اصطلاحات پیچیده بورسی)</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-auto">
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={onSpeak}>
            <Volume2 className="h-4 w-4 text-[#38bdf8]" />
            خلاصه صوتی هوشمند
          </Button>
          <div className="flex items-center rounded-lg border border-white/8 bg-black/40 p-0.5">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2.5" aria-pressed={!large} onClick={() => large && onToggleSize()}>
              A
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-7 px-2.5', large ? 'font-bold text-[#4edea3]' : undefined)}
              aria-pressed={large}
              onClick={() => !large && onToggleSize()}
            >
              A+
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
        <div className="space-y-2.5 rounded-xl border border-white/6 bg-black/40 p-4 text-right lg:col-span-8">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            <span className="text-xs font-extrabold text-[#4edea3]">خلاصه وضعیت سهم «{symbol || '—'}» برای سهامداران عزیز:</span>
          </div>
          <p className={cn('text-justify leading-7 font-medium text-[#f0f4fc]', large ? 'text-sm' : 'text-xs')}>{withFigures(summary)}</p>
        </div>
        <div className="flex h-full flex-col justify-between gap-3 rounded-xl border border-[#4edea3]/20 bg-[#4edea3]/4 p-4 lg:col-span-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="space-y-1">
              <span className="block text-xs font-bold text-emerald-400">نتیجه و پیشنهاد اقدام:</span>
              <p className="text-xs leading-5 text-slate-100">{action}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/6 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#4edea3]" />
              سطح ریسک فعلی: <strong className="text-[#4edea3]">—</strong>
            </span>
            <span className="text-slate-400">
              مدت مطالعه: کمتر از <Num>1</Num> دقیقه
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WatchlistTable({
  symbols,
  selected,
  emptyBecause,
  quoteFor,
  metaBySymbol,
  onSelect,
}: {
  symbols: string[];
  selected: string;
  emptyBecause: 'empty' | 'block' | 'filter' | null;
  quoteFor: (symbol: string) => LiveQuote | null;
  metaBySymbol: Record<string, SymbolItem>;
  onSelect: (symbol: string) => void;
}) {
  return (
    <section className="glass-card flex flex-col gap-3.5 rounded-xl p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-white/6 pb-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <List className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-bold text-white">
            دیده‌بان تحلیل هوشمند بازار (<Num>5</Num> نماد برتر بورس با بیشترین پتانسیل صعودی و تقاضا)
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            هسته TSETMC: <Num className="font-bold text-[#4edea3]">—</Num>
          </span>
          <span className="text-white/20">•</span>
          <span className="font-semibold text-[#38bdf8]">
            موتور شلیک Pro <Num>2.0</Num> آماده
          </span>
        </div>
      </div>
      <Table className="min-w-[840px] text-right text-xs">
        <TableHeader>
          <TableRow className="border-white/6 text-center text-[11px] text-slate-500 hover:bg-transparent">
            <TableHead className="px-4 py-3.5 text-right whitespace-nowrap">نماد و شرکت</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">امتیاز AI</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">آخرین قیمت</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">تغییر</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">قدرت خریدار</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">ورود نقدینگی</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">وضعیت تکنیکال</TableHead>
            <TableHead className="px-4 text-center whitespace-nowrap">عملیات تحلیلی</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-white/4 text-xs">
          {emptyBecause ? (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center text-slate-400">
                {emptyBecause === 'empty'
                  ? 'فهرست خالی است'
                  : emptyBecause === 'block'
                    ? 'تیپ معامله از سرور نمی‌رسد'
                    : 'نمادی با این فیلتر در دیده‌بان نیست'}
              </TableCell>
            </TableRow>
          ) : null}
          {symbols.map((symbol) => {
            const row = quoteFor(symbol);
            const rowPower = buyerPower(row);
            const net = netIndividualVolume(row);
            const active = symbol === selected;
            return (
              <TableRow key={symbol} className={cn('border-white/4', active ? 'bg-[#4edea3]/3' : undefined)}>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/30 bg-[#4edea3]/15 text-xs font-bold text-[#4edea3]">
                      {symbol}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white">{symbol}</span>
                      <span className="block text-[10px] text-slate-500">{row?.name || metaBySymbol[symbol]?.name || '—'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-3 text-center">
                  <span className="rounded bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">—</span>
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-white">
                  <Num>{row ? formatNumber(row.lastPrice) : '—'}</Num>
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-[#4edea3]">
                  {row ? renderPct(row.changePercent) : '—'}
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-[#4edea3]">
                  {rowPower != null ? (
                    <>
                      <Num>{rowPower.toFixed(2)}</Num> x
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-[#38bdf8]">
                  {net != null ? (
                    <>
                      <Num>{formatNumber(net)}</Num> سهم
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="px-3 text-center text-xs text-slate-300">{row?.stateTitle || '—'}</TableCell>
                <TableCell className="px-4 text-center">
                  <Button
                    type="button"
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    className={cn('h-8 whitespace-nowrap', active ? 'bg-[#4edea3] text-[#002b1b] hover:bg-[#6ffbbe]' : undefined)}
                    onClick={() => onSelect(symbol)}
                  >
                    {active ? 'مشاهده تحلیل کامل' : 'مشاهده تحلیل سهم'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function renderPct(value: number | null | undefined) {
  const text = formatPct(value);
  if (!text.endsWith('%')) return text;
  return (
    <>
      <Num>{text.slice(0, -1)}</Num>%
    </>
  );
}

function withFigures(text: string) {
  const parts = text.split(/([+-]?\d[\d,.]*)/g);
  return parts.map((part, index) => (/^[+-]?\d/.test(part) ? <Num key={index}>{part}</Num> : part));
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fa-IR';
  window.speechSynthesis.speak(utterance);
}
