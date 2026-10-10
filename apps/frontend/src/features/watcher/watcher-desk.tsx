'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { SymbolItem } from '@saf-shekan/core';
import { t as catalog } from '@saf-shekan/i18n';
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
  Trash2,
  TrendingUp,
  Volume2,
  Square,
  Wallet,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SymbolPicker } from '@/components/symbol-picker';
import { Num } from '@/components/num';
import { api, type DossierTrade, type LiveQuote, type MarketDossier } from '@/lib/api';
import { formatNumber, tomanFromRial } from '@/lib/format';
import { cn } from '@/lib/utils';
import { WatcherChart } from '@/features/watcher/watcher-chart';
import {
  atCeiling,
  buyerPower,
  closingChangePercent,
  formatPct,
  matchesFilter,
  netIndividualVolume,
  perCapitaBuyToman,
  priceBand,
  queueStats,
  readPe,
  suspiciousMultiple,
  type WatcherFilter,
} from '@/features/watcher/watcher-metrics';
import {
  collectAlertHits,
  loadArmedSymbols,
  postBrowserAlert,
  readAlertSnapshot,
  requestAlertPermission,
  saveArmedSymbols,
  type AlertKind,
  type AlertSnapshot,
} from '@/features/watcher/watcher-alerts';

const DOSSIER_CAP = 12;
const SELECTED_DOSSIER_MS = 15_000;
const REST_DOSSIER_MS = 45_000;

type DossierPhase = 'loading' | 'ready' | 'error';
type SortKey = 'last' | 'change' | 'power' | 'flow';

interface DeskAlert {
  id: string;
  symbol: string;
  kind: AlertKind;
  at: number;
}

function dossierTargets(watchlist: string[], selected: string): string[] {
  const capped = watchlist.slice(0, DOSSIER_CAP);
  if (!selected || !watchlist.includes(selected) || capped.includes(selected)) return capped;
  return [...capped.slice(0, DOSSIER_CAP - 1), selected];
}

function resolvedWatchSymbol(
  selected: string,
  query: string,
  watchlist: string[],
  metaBySymbol: Record<string, SymbolItem>,
): string {
  if (selected && (watchlist.includes(selected) || metaBySymbol[selected])) return selected;
  const trimmed = query.trim();
  if (trimmed && metaBySymbol[trimmed]) return trimmed;
  return '';
}

const FILTERS: {
  id: WatcherFilter;
  labelKey: 'filter.growth' | 'filter.flow' | 'filter.block' | 'filter.lightQueue';
  icon: typeof TrendingUp;
  iconClass: string;
}[] = [
  { id: 'growth', labelKey: 'filter.growth', icon: TrendingUp, iconClass: 'text-[#4edea3]' },
  { id: 'flow', labelKey: 'filter.flow', icon: Zap, iconClass: 'text-[#38bdf8]' },
  { id: 'block', labelKey: 'filter.block', icon: ArrowLeftRight, iconClass: 'text-[#ffb95f]' },
  { id: 'light-queue', labelKey: 'filter.lightQueue', icon: Rocket, iconClass: 'text-emerald-400' },
];

const SEARCH_ID = 'ticker-search-input';

export function WatcherDesk({ quotesBySymbol }: { quotesBySymbol: Record<string, LiveQuote> }) {
  const t = useTranslations('watcher');
  const td = useTranslations('dossier');
  const tc = useTranslations('common');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuotes, setLocalQuotes] = useState<Record<string, LiveQuote>>({});
  const [metaBySymbol, setMetaBySymbol] = useState<Record<string, SymbolItem>>({});
  const [filter, setFilter] = useState<WatcherFilter | null>(null);
  const [armed, setArmed] = useState<string[]>(() => loadArmedSymbols());
  const [alertEvents, setAlertEvents] = useState<DeskAlert[]>([]);
  const [summaryLarge, setSummaryLarge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Record<string, MarketDossier>>({});
  const [dossierPhase, setDossierPhase] = useState<Record<string, DossierPhase>>({});
  const headRef = useRef<HTMLElement>(null);
  const alertSnapshots = useRef<Record<string, AlertSnapshot>>({});

  useEffect(() => {
    let cancelled = false;
    api.getMarketStatus().then((status) => {
      if (cancelled) return;
      setWatchlist(status.watchlist);
      setError(status.lastError);
      setSelected((current) => current || status.watchlist[0] || '');
    }).catch(() => {
      if (!cancelled) setError(t('statusUnread'));
    });
    return () => {
      cancelled = true;
    };
  }, [t]);

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

  useEffect(() => {
    saveArmedSymbols(armed);
  }, [armed]);

  useEffect(() => {
    const targets = dossierTargets(watchlist, selected);
    if (targets.length === 0) return;
    let cancelled = false;
    const due = new Map<string, number>();
    const inflight = new Set<string>();
    let active = 0;

    const pump = () => {
      if (cancelled) return;
      const now = Date.now();
      const ready = targets
        .filter((symbol) => !inflight.has(symbol) && (due.get(symbol) ?? 0) <= now)
        .sort((left, right) => Number(right === selected) - Number(left === selected));
      for (const symbol of ready) {
        if (active >= 2) break;
        active += 1;
        inflight.add(symbol);
        setDossierPhase((current) => (current[symbol] === 'ready' ? current : { ...current, [symbol]: 'loading' }));
        void api.getMarketDossier(symbol).then((dossier) => {
          if (cancelled) return;
          if (dossier) {
            setDossiers((current) => ({ ...current, [symbol]: dossier }));
            setDossierPhase((current) => ({ ...current, [symbol]: 'ready' }));
            return;
          }
          setDossierPhase((current) => ({ ...current, [symbol]: 'error' }));
        }).finally(() => {
          active -= 1;
          inflight.delete(symbol);
          due.set(symbol, Date.now() + (symbol === selected ? SELECTED_DOSSIER_MS : REST_DOSSIER_MS));
          if (!cancelled) pump();
        });
      }
    };

    pump();
    const timer = window.setInterval(pump, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [watchlist, selected]);

  useEffect(() => {
    const { next, hits } = collectAlertHits(
      watchlist,
      new Set(armed),
      alertSnapshots.current,
      (symbol) => readAlertSnapshot(quotesBySymbol[symbol] ?? localQuotes[symbol] ?? null, dossiers[symbol] ?? null),
    );
    alertSnapshots.current = next;
    if (hits.length === 0) return;
    const at = Date.now();
    setAlertEvents((current) =>
      [
        ...hits.map((hit, index) => ({
          id: `${at}-${hit.symbol}-${hit.kind}-${index}`,
          symbol: hit.symbol,
          kind: hit.kind,
          at,
        })),
        ...current,
      ].slice(0, 40),
    );
    for (const hit of hits) {
      postBrowserAlert(t('smartAlert'), `${hit.symbol} — ${t(`alert.${hit.kind}`)}`);
    }
  }, [armed, dossiers, localQuotes, quotesBySymbol, t, watchlist]);

  const quoteFor = (symbol: string) => quotesBySymbol[symbol] ?? localQuotes[symbol] ?? null;
  const quote = selected ? quoteFor(selected) : null;
  const meta = selected ? metaBySymbol[selected] ?? null : null;
  const dossier = selected ? dossiers[selected] ?? null : null;
  const power = buyerPower(quote);
  const multiple = dossier?.indicators.volumeVsBase ?? suspiciousMultiple(quote, meta);
  const book = queueStats(quote?.orderBook ?? []);
  const band = quote ? priceBand(quote) : null;
  const locked = quote ? atCeiling(quote) : false;
  const group = dossier?.fundamentals.group || meta?.group || null;
  const pe = dossier?.fundamentals.pe ?? readPe(meta?.pe);
  const visible = watchlist.filter((symbol) =>
    matchesFilter(filter, quoteFor(symbol), { hasBlock: dossiers[symbol]?.hasBlock === true })
  );
  const watchSymbol = resolvedWatchSymbol(selected, query, watchlist, metaBySymbol);
  const watching = watchSymbol !== '' && watchlist.includes(watchSymbol);
  const alertOn = selected !== '' && armed.includes(selected);
  const blockPending =
    filter === 'block' &&
    visible.length === 0 &&
    watchlist.some((symbol) => dossiers[symbol] == null && dossierPhase[symbol] !== 'error');
  const missing = td('noServerData');
  const summary = dossier?.narrative.summary ?? missing;
  const action = dossier?.narrative.action ?? missing;
  const risk = dossier?.narrative.risk ?? 'unknown';
  const riskReason = dossier?.narrative.riskReason ?? missing;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -inset-x-4 -top-6 -z-10 h-[720px] overflow-hidden">
        <div className="absolute -top-40 end-1/4 h-[500px] w-[600px] rounded-full bg-[#4edea3]/4 blur-[160px]" />
        <div className="absolute top-20 start-1/4 h-[450px] w-[550px] rounded-full bg-[#38bdf8]/4 blur-[170px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <section ref={headRef} className="glass-card flex flex-col gap-4 rounded-xl p-5">
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-white/6 pb-3.5 lg:flex-row lg:items-center">
          <SymbolPicker
            variant="field"
            detail="brief"
            inputId={SEARCH_ID}
            value={query}
            open={searchOpen}
            onOpenChange={setSearchOpen}
            onQueryChange={setQuery}
            onSelect={(item) => {
              setQuery(item.symbol);
              void api.searchSymbols(item.symbol, 8).then((items) => {
                const full = items.find((entry) => entry.symbol === item.symbol);
                if (!full) return;
                setMetaBySymbol((current) => ({ ...current, [item.symbol]: full }));
              });
              void api.watchSymbol(item.symbol).then((res) => {
                setWatchlist(res.watchlist);
                setSelected(item.symbol);
              });
            }}
          />
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto pb-1 text-xs lg:pb-0">
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
                    'h-auto shrink-0 gap-1.5 rounded-lg px-3 py-1.5',
                    active
                      ? 'border border-[#4edea3]/30 bg-[#4edea3]/15 font-bold text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)] hover:bg-[#4edea3]/25 hover:text-[#4edea3]'
                      : 'border border-white/6 bg-white/3 font-normal text-[#9ba6b8] hover:bg-white/6 hover:text-[#dfe2ef]'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', item.iconClass)} />
                  {t(item.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>
        {error ? <p className="text-[11px] text-amber-400">{error}</p> : null}
        {quote?.warning ? <p className="text-[11px] text-amber-400">{quote.warning}</p> : null}
        {dossier?.warning && dossier.warning !== quote?.warning ? (
          <p className="text-[11px] text-amber-400">{dossier.warning}</p>
        ) : null}

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col justify-between gap-4 border-b border-white/6 pb-3 md:flex-row md:items-center">
            <div className="flex shrink-0 items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#4edea3]/35 bg-gradient-to-br from-[#4edea3]/25 to-[#4edea3]/5 shadow-[0_0_15px_rgba(78,222,163,0.25)]">
                <span className="text-[20px] font-black tracking-tight text-[#4edea3]">{quote?.symbol || selected || '—'}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-white">{quote?.name || meta?.name || t('noSymbol')}</h1>
                  {group ? (
                    <Badge variant="cyan" className="rounded px-2 py-0.5 text-[10px]">
                      {group}
                    </Badge>
                  ) : (
                    <Badge variant="muted" className="rounded px-2 py-0.5 text-[10px]">{t('industryEmpty')}</Badge>
                  )}
                  <Badge variant="emerald" className="rounded px-2 py-0.5 text-[11px] shadow-[0_0_8px_rgba(78,222,163,0.15)]">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#4edea3]" />
                    {locked ? t('buyLock') : quote?.stateTitle || tc('dash')}
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
                    {t('band')} <span className="font-bold text-[#ffb95f]">{band ? withFigures(band) : <Num>{tc('dash')}</Num>}</span>
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-slate-400">
                    {t('baseVolume')} <Num className="font-bold text-[#4edea3]">{meta?.baseVolume != null ? formatNumber(meta.baseVolume) : tc('dash')}</Num>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 self-start md:self-auto">
              <Button
                type="button"
                size="sm"
                className="h-9 bg-[#4edea3] px-4 text-[#002b1b] shadow-[0_0_15px_rgba(78,222,163,0.3)] hover:bg-[#6ffbbe]"
                disabled={!watchSymbol}
                onClick={() => {
                  if (!watchSymbol) return;
                  const request = watching ? api.unwatchSymbol(watchSymbol) : api.watchSymbol(watchSymbol);
                  void request.then((res) => {
                    setWatchlist(res.watchlist);
                    if (!watching) {
                      setSelected(watchSymbol);
                      return;
                    }
                    if (selected === watchSymbol) setSelected(res.watchlist[0] ?? '');
                  }).catch(() => setError(t('statusUnread')));
                }}
              >
                <Star className={cn('h-4 w-4', watching ? 'fill-current' : undefined)} />
                {watching ? t('removeWatch') : t('addWatch')}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn('h-9 px-4', alertOn ? 'border-[#ffb95f]/40 text-[#ffb95f]' : undefined)}
                    aria-pressed={alertOn}
                    disabled={!selected}
                    onClick={() => {
                      if (!selected) return;
                      const enabling = !armed.includes(selected);
                      if (enabling) requestAlertPermission();
                      setArmed((current) =>
                        enabling ? [...current, selected] : current.filter((item) => item !== selected),
                      );
                    }}
                  >
                    <Bell className={cn('h-4 w-4 text-[#ffb95f]', alertOn ? 'fill-current' : undefined)} />
                    {t('smartAlert')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3">
                  <AlertFeed armed={armed} events={alertEvents} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-5">
            <MetricCard
              label={t('lastTrade')}
              icon={<Wallet className="h-4 w-4 text-[#4edea3]" />}
              value={quote ? formatNumber(quote.lastPrice) : null}
              unit={tc('rial')}
              badge={quote ? renderPct(quote.changePercent) : null}
              accent
            />
            <MetricCard
              label={t('closingPrice')}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              value={quote ? formatNumber(quote.closingPrice) : null}
              unit={tc('rial')}
              badge={quote ? renderPct(closingChangePercent(quote)) : null}
            />
            <MetricCard
              label={t('volume')}
              icon={<BarChart3 className="h-4 w-4 text-[#38bdf8]" />}
              value={quote ? formatNumber(quote.volume) : null}
              unit={tc('share')}
              badge={multiple != null ? <><Num>{multiple.toFixed(1)}</Num>{t('baseMultipleTail')}</> : null}
              badgeTone="text-[#ffb95f]"
              valueTone="text-[#38bdf8]"
            />
            <MetricCard
              label={t('pe')}
              icon={<PieChart className="h-4 w-4 text-[#4edea3]" />}
              value={pe != null ? formatNumber(pe) : null}
              unit={t('timesUnit')}
              badge={group ? t('group', { name: group }) : null}
            />
            <MetricCard
              label={t('floatShares')}
              icon={<CircleDashed className="h-4 w-4 text-[#ffb95f]" />}
              value={
                dossier?.fundamentals.floatPercent != null
                  ? formatNumber(Number(dossier.fundamentals.floatPercent.toFixed(2)))
                  : null
              }
              unit={tc('percent')}
              badge={
                dossier?.fundamentals.floatShares != null ? (
                  <>
                    <Num>{formatNumber(dossier.fundamentals.floatShares)}</Num> {tc('share')}
                  </>
                ) : null
              }
              valueTone="text-[#ffb95f]"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-3">
          <OrderBookCard quote={quote} locked={locked} book={book} />
          <TapeCard trades={dossier?.trades ?? []} />
        </div>
        <div className="xl:col-span-5">
          <WatcherChart
            quote={quote}
            candles={dossier?.candles ?? null}
            vwap={dossier?.indicators.vwap ?? null}
            largestTrade={dossier?.largestTrade ?? null}
          />
        </div>
        <div className="xl:col-span-4">
          <AnalysisCard
            quote={quote}
            signal={action}
            power={power}
            multiple={multiple}
            monthRatio={dossier?.indicators.volumeVsMonth ?? null}
            rsi={dossier?.indicators.rsi14 ?? null}
            coverage={dossier?.indicators.coverage ?? null}
            floatPercent={dossier?.fundamentals.floatPercent ?? null}
            ceiling={dossier?.references.ceiling ?? quote?.pMax ?? null}
            floor={dossier?.references.floor ?? quote?.pMin ?? null}
            vwap={dossier?.references.vwap ?? null}
          />
        </div>
      </div>

      <SummaryCard
        symbol={quote?.symbol || selected}
        summary={summary}
        action={action}
        risk={risk}
        riskReason={riskReason}
        large={summaryLarge}
        onToggleSize={() => setSummaryLarge((current) => !current)}
        onSpeak={() => speakPersian(summary)}
      />

      <WatchlistTable
        symbols={visible}
        total={watchlist.length}
        selected={selected}
        source={quote?.source ?? null}
        emptyBecause={
          watchlist.length === 0
            ? 'empty'
            : blockPending
              ? 'loading'
              : filter === 'block' && visible.length === 0
                ? 'block'
                : visible.length === 0
                  ? 'filter'
                  : null
        }
        quoteFor={quoteFor}
        rsiFor={(symbol) => dossiers[symbol]?.indicators.rsi14 ?? null}
        phaseFor={(symbol) => dossierPhase[symbol] ?? null}
        metaBySymbol={metaBySymbol}
        onSelect={(symbol) => {
          setSelected(symbol);
          headRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onRemove={(symbol) => {
          void api.unwatchSymbol(symbol).then((res) => {
            setWatchlist(res.watchlist);
            if (selected === symbol) setSelected(res.watchlist[0] ?? '');
          }).catch(() => setError(t('statusUnread')));
        }}
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
  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  const levels = (quote?.orderBook ?? []).slice(0, 5);
  return (
    <section className="glass-card flex flex-col gap-3.5 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/10 text-[#38bdf8]">
            <List className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-white"><Num>5</Num> {t('topBookLabel')}</span>
        </div>
        <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-2 py-0.5 text-[11px] font-bold text-[#4edea3]">
          {locked ? t('ceilingLock') : quote?.stateTitle || tc('dash')}
        </span>
      </div>
      <div className="grid grid-cols-12 border-b border-white/5 pb-2 text-center text-[10px] text-slate-500">
        <span className="col-span-2">{t('count')}</span>
        <span className="col-span-4">{t('bidVolume')}</span>
        <span className="col-span-3">{t('bidPrice')}</span>
        <span className="col-span-3">{t('ask')}</span>
      </div>
      <div className="space-y-1.5 text-xs">
        {levels.length === 0 ? <p className="py-3 text-center text-slate-500">{t('noBook')}</p> : null}
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
          <span className="text-[11px] text-slate-500">{t('bidValue')}</span>
          <span className="text-xs font-black text-[#4edea3]">
            {book.bidValue > 0 ? (
              <>
                <Num>{formatNumber(book.bidValue)}</Num> {t('bidValueMid')} <Num>{formatNumber(tomanFromRial(book.bidValue))}</Num> {tc('toman')})
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
            {t('buyers')} <Num className="font-bold text-[#4edea3]">{formatNumber(book.buyers)}</Num>
          </span>
          <span className="text-emerald-400">
            {t('offers')} <Num className="font-bold">{formatNumber(book.offers)}</Num>
          </span>
        </div>
      </div>
    </section>
  );
}

function TapeCard({ trades }: { trades: DossierTrade[] }) {
  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  return (
    <section className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <List className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-white">{t('tapeTitle')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-1.5 py-0.5 text-[10px] text-[#4edea3]/80">
            <Num>{trades.length}</Num>
          </span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
        </div>
      </div>
      {trades.length === 0 ? (
        <p className="rounded-lg border border-white/4 bg-[#05070d]/60 p-2 text-[11px] text-slate-500">
          {t('noTrades')}
        </p>
      ) : (
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {trades.map((trade, index) => (
            <div
              key={`${trade.time}-${trade.price}-${trade.volume}-${trade.kind}-${index}`}
              className="rounded-lg border border-white/4 bg-[#05070d]/60 p-2 text-[11px]"
            >
              <div className="flex items-center justify-between gap-2">
                <Num className="text-slate-400">{trade.time}</Num>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    trade.kind === 'code-to-code'
                      ? 'bg-[#ffb95f]/15 text-[#ffb95f]'
                      : trade.kind === 'large'
                        ? 'bg-[#4edea3]/15 text-[#4edea3]'
                        : 'bg-white/8 text-slate-400'
                  )}
                >
                  {trade.note}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-200">
                <span>
                  <Num>{formatNumber(trade.volume)}</Num> {tc('share')}
                </span>
                <Num className="font-bold">{formatNumber(trade.price)}</Num>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AnalysisCard({
  quote,
  signal,
  power,
  multiple,
  monthRatio,
  rsi,
  coverage,
  floatPercent,
  ceiling,
  floor,
  vwap,
}: {
  quote: LiveQuote | null;
  signal: string;
  power: number | null;
  multiple: number | null;
  monthRatio: number | null;
  rsi: number | null;
  coverage: { arrived: number; expected: number } | null;
  floatPercent: number | null;
  ceiling: number | null;
  floor: number | null;
  vwap: number | null;
}) {
  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  const order = useTranslations('console');
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
          <span className="text-xs font-bold text-white">{t('analysisTitle')}</span>
        </div>
        <span className="rounded border border-[#4edea3]/25 bg-[#4edea3]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#4edea3]" dir="ltr">
          {coverage ? (
            <>
              <Num>{coverage.arrived}</Num>/<Num>{coverage.expected}</Num>
            </>
          ) : (
            <Num>—</Num>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#4edea3]/25 bg-[#05070d]/80 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">{t('signal')}</span>
          <span className="text-xs font-bold leading-6 text-[#4edea3]">{signal}</span>
          <span className="text-xs leading-relaxed text-slate-400">
            {power != null ? (
              <>
                {t('buyerRatioLabel')} <Num>{power.toFixed(2)}</Num>
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#4edea3]/40 bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.3)]">
          <Num className="text-base font-black text-[#4edea3]">
            {coverage ? coverage.arrived : '—'}
          </Num>
          <span className="-mt-0.5 text-[9px] text-slate-500">{t('coverage')}</span>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#38bdf8]/20 bg-[#111624]/60 p-2.5 text-xs">
        <div className="flex shrink-0 items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-[#38bdf8]" />
          <span className="font-semibold text-slate-100">{t('technical')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-[#4edea3]/25 bg-[#4edea3]/15 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#4edea3]">
            {quote?.stateTitle || '—'}
          </span>
          <span className="text-[11px] font-bold text-[#38bdf8]">
            RSI: <Num>{rsi != null ? rsi.toFixed(1) : '—'}</Num>
          </span>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <QuantRow label={t('smartFlow')}>
          {net != null ? (
            <>
              <Num>{formatNumber(net)}</Num> {tc('share')}
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
        <QuantRow label={t('powerRatio')}>
          {power != null ? (
            <>
              <Num>{power.toFixed(2)}</Num> x
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
        <QuantRow label={t('perCapita')} tone="text-[#38bdf8]">
          {perCapita != null ? (
            <>
              <Num>{formatNumber(perCapita)}</Num> {tc('toman')}
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
        <QuantRow label={t('monthVolume')} tone="text-[#ffb95f]">
          {monthRatio != null ? (
            <>
              <Num>{monthRatio.toFixed(1)}</Num> {tc('times')}
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
        <QuantRow label={t('baseRatio')}>
          {multiple != null ? (
            <>
              <Num>{multiple.toFixed(1)}</Num> {tc('times')}
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
        <QuantRow label={t('floatLabel')}>
          {floatPercent != null ? (
            <>
              <Num>{floatPercent.toFixed(2)}</Num> {tc('percent')}
            </>
          ) : (
            <Num>{tc('dash')}</Num>
          )}
        </QuantRow>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <TargetBox label={order('ceiling')} value={ceiling} tone="border-[#4edea3]/20 text-[#4edea3]" />
        <TargetBox label={order('floor')} value={floor} tone="border-rose-500/20 text-rose-400" />
        <TargetBox label={t('vwap')} value={vwap} tone="border-[#38bdf8]/20 text-[#38bdf8]" />
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

function TargetBox({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  const tc = useTranslations('common');
  return (
    <div className={cn('flex flex-col rounded-lg border bg-black/40 p-2.5', tone)}>
      <span className="text-[10px] text-slate-500">{label}</span>
      <Num className="mt-0.5 text-xs font-bold">{value != null && value > 0 ? formatNumber(Math.round(value)) : tc('dash')}</Num>
      <span className="text-[10px] opacity-70">{tc('rial')}</span>
    </div>
  );
}

function SummaryCard({
  symbol,
  summary,
  action,
  risk,
  riskReason,
  large,
  onToggleSize,
  onSpeak,
}: {
  symbol: string;
  summary: string;
  action: string;
  risk: MarketDossier['narrative']['risk'];
  riskReason: string;
  large: boolean;
  onToggleSize: () => void;
  onSpeak: () => Promise<string | null>;
}) {
  const t = useTranslations('watcher');
  const td = useTranslations('dossier');
  const tc = useTranslations('common');
  const [speechNote, setSpeechNote] = useState<string | null>(null);
  const [speechPhase, setSpeechPhase] = useState<SpeechPhase>('idle');
  useEffect(() => subscribeSpeechPhase(setSpeechPhase), []);
  const speaking = speechPhase !== 'idle';
  const riskText =
    risk === 'low' ? td('risk.low') : risk === 'medium' ? td('risk.medium') : risk === 'high' ? td('risk.high') : td('risk.unknown');
  return (
    <section className="glass-card flex w-full flex-col gap-4 rounded-xl border border-[#4edea3]/30 bg-[#0c121e]/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              {t('plainTitle')}
              <span className="rounded border border-[#4edea3]/20 bg-[#4edea3]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4edea3]">
                {symbol || tc('dash')}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">{t('plainHint')}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            aria-pressed={speaking}
            onClick={() => {
              if (speechIsActive()) {
                stopSpokenSummary();
                setSpeechNote(null);
                return;
              }
              setSpeechNote(null);
              void onSpeak().then((note) => setSpeechNote(note));
            }}
          >
            {speaking ? <Square className="h-3.5 w-3.5 fill-current text-rose-300" /> : <Volume2 className="h-4 w-4 text-[#38bdf8]" />}
            {speaking ? t('voiceStop') : t('voice')}
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
      {speechNote ? <p className="text-xs text-[#ffb95f]">{speechNote}</p> : null}
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
        <div className="space-y-2.5 rounded-xl border border-white/6 bg-black/40 p-4 text-right lg:col-span-8">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            <span className="text-xs font-extrabold text-[#4edea3]">{t('summaryLead', { symbol: symbol || tc('dash') })}</span>
          </div>
          <p className={cn('text-justify leading-7 font-medium text-[#f0f4fc]', large ? 'text-sm' : 'text-xs')}>{withFigures(summary)}</p>
        </div>
        <div className="flex h-full flex-col justify-between gap-3 rounded-xl border border-[#4edea3]/20 bg-[#4edea3]/4 p-4 lg:col-span-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="space-y-1">
              <span className="block text-xs font-bold text-emerald-400">{t('actionLead')}</span>
              <p className="text-xs leading-5 text-slate-100">{action}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/6 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#4edea3]" />
              {t('riskLevel')} <strong className={riskTone(risk)}>{riskText}</strong>
            </span>
            <span className="max-w-[14rem] text-left text-slate-400">{riskReason}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WatchlistTable({
  symbols,
  total,
  selected,
  source,
  emptyBecause,
  quoteFor,
  rsiFor,
  phaseFor,
  metaBySymbol,
  onSelect,
  onRemove,
}: {
  symbols: string[];
  total: number;
  selected: string;
  source: LiveQuote['source'] | null;
  emptyBecause: 'empty' | 'block' | 'filter' | 'loading' | null;
  quoteFor: (symbol: string) => LiveQuote | null;
  rsiFor: (symbol: string) => number | null;
  phaseFor: (symbol: string) => DossierPhase | null;
  metaBySymbol: Record<string, SymbolItem>;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}) {
  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null);
  const ordered = sortRows(symbols, sort, quoteFor);
  return (
    <section className="glass-card flex flex-col gap-3.5 rounded-xl p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-white/6 pb-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 text-[#4edea3]">
            <List className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-bold text-white">
            {t('watchTitleOpen')}<Num>{total}</Num> {t('watchTitleClose')}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            {t('priceSource')} <Num className="font-bold text-[#4edea3]">{source ?? tc('dash')}</Num>
          </span>
        </div>
      </div>
      <Table className="min-w-[840px] text-right text-xs">
        <TableHeader>
          <TableRow className="border-white/6 text-center text-[11px] text-slate-500 hover:bg-transparent">
            <TableHead className="px-4 py-3.5 text-right whitespace-nowrap">{t('colSymbol')}</TableHead>
            <TableHead className="px-3 text-center whitespace-nowrap">RSI</TableHead>
            <SortHead label={t('colLast')} sortKey="last" sort={sort} onSort={() => setSort((current) => nextSort(current, 'last'))} />
            <SortHead label={t('colChange')} sortKey="change" sort={sort} onSort={() => setSort((current) => nextSort(current, 'change'))} />
            <SortHead label={t('colPower')} sortKey="power" sort={sort} onSort={() => setSort((current) => nextSort(current, 'power'))} />
            <SortHead label={t('colFlow')} sortKey="flow" sort={sort} onSort={() => setSort((current) => nextSort(current, 'flow'))} />
            <TableHead className="px-3 text-center whitespace-nowrap">{t('colTechnical')}</TableHead>
            <TableHead className="px-4 text-center whitespace-nowrap">{t('colAction')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-white/4 text-xs">
          {emptyBecause ? (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center text-slate-400">
                {emptyBecause === 'empty'
                  ? t('emptyList')
                  : emptyBecause === 'loading'
                    ? t('filterPending')
                  : emptyBecause === 'block'
                    ? t('emptyBlock')
                    : t('emptyFilter')}
              </TableCell>
            </TableRow>
          ) : null}
          {ordered.map((symbol) => {
            const row = quoteFor(symbol);
            const rowPower = buyerPower(row);
            const net = netIndividualVolume(row);
            const rsi = rsiFor(symbol);
            const phase = phaseFor(symbol);
            const active = symbol === selected;
            return (
              <TableRow
                key={symbol}
                className={cn('cursor-pointer border-white/4', active ? 'bg-[#4edea3]/3' : undefined)}
                onClick={() => onSelect(symbol)}
              >
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
                  <span className="rounded bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                    {rsi != null ? (
                      <Num>{rsi.toFixed(1)}</Num>
                    ) : phase === 'loading' ? (
                      t('dossierLoading')
                    ) : (
                      '—'
                    )}
                  </span>
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-white">
                  <Num>{row ? formatNumber(row.lastPrice) : '—'}</Num>
                </TableCell>
                <TableCell className={cn('px-3 text-center font-bold', signedTone(row?.changePercent))}>
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
                <TableCell className={cn('px-3 text-center font-bold', signedTone(net))}>
                  {net != null ? (
                    <>
                      <Num>{formatNumber(net)}</Num> {tc('share')}
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="px-3 text-center text-xs text-slate-300">{row?.stateTitle || '—'}</TableCell>
                <TableCell className="px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      className={cn('h-8 whitespace-nowrap', active ? 'bg-[#4edea3] text-[#002b1b] hover:bg-[#6ffbbe]' : undefined)}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(symbol);
                      }}
                    >
                      {active ? t('viewFull') : t('viewSymbol')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-rose-300"
                      aria-label={t('removeWatch')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(symbol);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function AlertFeed({ armed, events }: { armed: string[]; events: DeskAlert[] }) {
  const t = useTranslations('watcher');
  const tc = useTranslations('common');
  return (
    <div className="space-y-3 text-right">
      <p className="text-xs font-bold text-white">{t('alertFeed')}</p>
      <div>
        <p className="text-[11px] text-slate-500">{t('alertArmed')}</p>
        {armed.length === 0 ? (
          <p className="mt-1 text-[11px] text-slate-500">{tc('dash')}</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {armed.map((symbol) => (
              <li key={symbol} className="text-xs text-[#ffb95f]">{symbol}</li>
            ))}
          </ul>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-[11px] text-slate-500">{t('alertEmpty')}</p>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto">
          {events.map((event) => (
            <li key={event.id} className="rounded border border-white/6 bg-black/30 px-2 py-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{event.symbol}</span>
                <Num className="text-slate-500">
                  {new Date(event.at).toLocaleTimeString('en-GB', { hour12: false })}
                </Num>
              </div>
              <p className="text-slate-300">{t(`alert.${event.kind}`)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: 'asc' | 'desc' } | null;
  onSort: () => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <TableHead className="px-3 text-center whitespace-nowrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-7 px-1', active ? 'text-[#4edea3]' : undefined)}
        aria-pressed={active}
        onClick={onSort}
      >
        {label}
        {active ? <span>{sort.dir === 'asc' ? '↑' : '↓'}</span> : null}
      </Button>
    </TableHead>
  );
}

function nextSort(current: { key: SortKey; dir: 'asc' | 'desc' } | null, key: SortKey) {
  if (current?.key !== key) return { key, dir: 'desc' as const };
  if (current.dir === 'desc') return { key, dir: 'asc' as const };
  return null;
}

function sortRows(
  symbols: string[],
  sort: { key: SortKey; dir: 'asc' | 'desc' } | null,
  quoteFor: (symbol: string) => LiveQuote | null,
): string[] {
  if (!sort) return symbols;
  const dir = sort.dir === 'asc' ? 1 : -1;
  const valueOf = (symbol: string): number | null => {
    const quote = quoteFor(symbol);
    if (sort.key === 'last') return quote && quote.lastPrice > 0 ? quote.lastPrice : null;
    if (sort.key === 'change') return quote ? quote.changePercent : null;
    if (sort.key === 'power') return buyerPower(quote);
    return netIndividualVolume(quote);
  };
  return [...symbols].sort((left, right) => {
    const a = valueOf(left);
    const b = valueOf(right);
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return (a - b) * dir;
  });
}

function signedTone(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return 'text-slate-400';
  return value > 0 ? 'text-[#4edea3]' : 'text-rose-400';
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

function riskTone(risk: MarketDossier['narrative']['risk']): string {
  if (risk === 'high') return 'text-rose-400';
  if (risk === 'medium') return 'text-[#ffb95f]';
  if (risk === 'low') return 'text-[#4edea3]';
  return 'text-slate-400';
}

type SpeechPhase = 'idle' | 'loading' | 'playing';

let speechPhase: SpeechPhase = 'idle';
let speechGeneration = 0;
let speechAbort: AbortController | null = null;
const speechListeners = new Set<(phase: SpeechPhase) => void>();

function speechIsActive() {
  return speechPhase !== 'idle';
}

function setSpeechPhase(next: SpeechPhase) {
  speechPhase = next;
  speechListeners.forEach((listener) => listener(next));
}

function subscribeSpeechPhase(listener: (phase: SpeechPhase) => void) {
  speechListeners.add(listener);
  listener(speechPhase);
  return () => {
    speechListeners.delete(listener);
  };
}

async function speakPersian(text: string): Promise<string | null> {
  stopSpokenSummary();
  const token = speechGeneration;
  const abort = new AbortController();
  speechAbort = abort;
  unlockSummaryAudio();
  setSpeechPhase('loading');
  try {
    const blob = await api.speakSummary(text, abort.signal);
    if (token !== speechGeneration) return null;
    await playSpokenSummary(blob, token);
    return null;
  } catch {
    if (token !== speechGeneration || abort.signal.aborted) return null;
    setSpeechPhase('idle');
    return catalog('watcher', 'voiceUnavailable');
  }
}

let summaryContext: AudioContext | null = null;
let summarySource: AudioBufferSourceNode | null = null;

function unlockSummaryAudio() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  if (!summaryContext) summaryContext = new AudioContext();
  if (summaryContext.state === 'suspended') void summaryContext.resume();
}

function stopSpokenSummary() {
  speechGeneration += 1;
  speechAbort?.abort();
  speechAbort = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  const source = summarySource;
  summarySource = null;
  if (source) {
    try {
      source.stop();
    } catch {
      // already finished
    }
  }
  setSpeechPhase('idle');
}

async function playSpokenSummary(blob: Blob, token: number): Promise<void> {
  unlockSummaryAudio();
  if (!summaryContext) throw new Error('no audio');
  if (summaryContext.state === 'suspended') await summaryContext.resume();
  if (token !== speechGeneration) return;
  const decoded = await summaryContext.decodeAudioData(await blob.arrayBuffer());
  if (token !== speechGeneration) return;
  const source = summaryContext.createBufferSource();
  source.buffer = decoded;
  source.connect(summaryContext.destination);
  summarySource = source;
  source.onended = () => {
    if (summarySource !== source) return;
    summarySource = null;
    setSpeechPhase('idle');
  };
  source.start();
  setSpeechPhase('playing');
}
