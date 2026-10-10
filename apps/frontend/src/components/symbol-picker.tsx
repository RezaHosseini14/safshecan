'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SymbolItem } from '@saf-shekan/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Num } from '@/components/num';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { formatNumber, tomanFromRial } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATALOG_LIMIT = 10_000;
const ROW_ESTIMATE = 52;

function fold(text: string): string {
  return text.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, '').trim().toLowerCase();
}

export function sharePrice(item: SymbolItem): number | null {
  if (item.price != null && item.price > 0) return item.price;
  if (item.closingPrice != null && item.closingPrice > 0) return item.closingPrice;
  return null;
}

function changeLabel(item: SymbolItem): { text: string; tone: string } | null {
  const price = item.price;
  const yesterday = item.yesterdayPrice;
  if (price == null || yesterday == null || price <= 0 || yesterday <= 0) return null;
  const pct = ((price - yesterday) / yesterday) * 100;
  const sign = pct > 0 ? '+' : '';
  const tone = pct > 0 ? 'text-emerald-400' : pct < 0 ? 'text-rose-400' : 'text-slate-400';
  return { text: `${sign}${pct.toFixed(1)}%`, tone };
}

export function SymbolPicker({
  value,
  onQueryChange,
  onSelect,
  label = 'نماد',
  variant = 'button',
  open: openProp,
  onOpenChange,
  inputId,
}: {
  value: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: SymbolItem) => void;
  label?: string;
  variant?: 'button' | 'field';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputId?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const [catalog, setCatalog] = useState<SymbolItem[]>([]);
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(0);
  const [pickedSymbol, setPickedSymbol] = useState('');
  const followActive = useRef(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolledOpen(next);
      if (next && variant === 'button') {
        setFilter('');
        setActive(0);
      }
    },
    [onOpenChange, openProp, variant]
  );

  useLayoutEffect(() => {
    if (variant !== 'field' || !open) return;
    const place = () => {
      const node = fieldRef.current;
      const panel = panelRef.current;
      if (!node || !panel) return;
      const rect = node.getBoundingClientRect();
      panel.style.top = `${rect.bottom + 6}px`;
      panel.style.left = `${rect.left}px`;
      panel.style.width = `${rect.width}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, variant]);

  useEffect(() => {
    if (variant !== 'field' || !open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (fieldRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen, variant]);

  useEffect(() => {
    let cancelled = false;
    api.searchSymbols('', CATALOG_LIMIT).then((next) => {
      if (cancelled) return;
      setCatalog(next);
      setCatalogState(next.length > 0 ? 'ready' : 'empty');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = fold(variant === 'field' ? value : filter);
  const showCatalog =
    variant === 'field' && open && needle !== '' && needle === fold(pickedSymbol);
  const symbols = useMemo(() => {
    if (!needle || showCatalog) return catalog;
    return catalog.filter(
      (item) =>
        fold(item.symbol).includes(needle) ||
        fold(item.name).includes(needle) ||
        (item.isin ? item.isin.toLowerCase().includes(needle) : false) ||
        (item.group ? fold(item.group).includes(needle) : false)
    );
  }, [catalog, needle, showCatalog]);

  const choose = (item: SymbolItem) => {
    setPickedSymbol(item.symbol);
    setOpen(false);
    onSelect(item);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (symbols.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      followActive.current = true;
      setActive((index) => Math.min(symbols.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      followActive.current = true;
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = symbols[active];
      if (item) choose(item);
    }
  };

  const results = (
    <>
      {variant === 'button' ? (
        <Command shouldFilter={false} className="bg-[#141924]">
          <CommandInput
            value={filter}
            onValueChange={(next) => {
              setFilter(next);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="جستجوی نماد، نام یا ISIN"
          />
        </Command>
      ) : null}
      <SymbolVirtualList
        symbols={symbols}
        catalogState={catalogState}
        active={active}
        pickedSymbol={pickedSymbol}
        followActive={followActive}
        onActive={setActive}
        onChoose={choose}
      />
    </>
  );

  if (variant === 'field') {
    return (
      <div ref={fieldRef} className="relative z-30 max-w-lg flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[#4a5568]" />
        <Input
          id={inputId}
          value={value}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder="جستجوی نماد، نام شرکت یا صنعت (فزر، اهرم، شپنا)..."
          className="h-auto w-full rounded-lg border-white/10 bg-[rgba(5,7,13,0.85)] py-2 pr-11 pl-24 font-sans text-xs text-[#dfe2ef] transition-all placeholder:text-[#4a5568] focus:border-[#4edea3]/40 focus:ring-0"
        />
        <div
          dir="ltr"
          className="pointer-events-none absolute top-1/2 left-2.5 flex -translate-y-1/2 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#9ba6b8]"
        >
          <span className="font-bold text-[#4edea3]">CTRL</span>
          <span className="text-[#4a5568]">+</span>
          <span className="font-bold text-[#4edea3]">K</span>
        </div>
        {open
          ? createPortal(
              <div
                ref={panelRef}
                className="fixed z-50 overflow-hidden rounded-lg border border-white/10 bg-[#05070d] font-sans shadow-xl"
              >
                {results}
              </div>,
              document.body
            )
          : null}
      </div>
    );
  }

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between border-white/10 bg-[#141924] px-3 text-xs font-normal text-slate-100 hover:bg-[#141924] hover:text-slate-100 focus:border-emerald-500 data-[state=open]:border-emerald-500"
          >
            <span className={value ? 'truncate' : 'truncate text-slate-400'}>{value || 'نماد را انتخاب کنید'}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-[#141924] p-0 shadow-xl">{results}</PopoverContent>
      </Popover>
    </div>
  );
}

function SymbolVirtualList({
  symbols,
  catalogState,
  active,
  pickedSymbol,
  followActive,
  onActive,
  onChoose,
}: {
  symbols: SymbolItem[];
  catalogState: 'loading' | 'ready' | 'empty';
  active: number;
  pickedSymbol: string;
  followActive: { current: boolean };
  onActive: (index: number) => void;
  onChoose: (item: SymbolItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns functions React Compiler cannot memoize
  const virtualizer = useVirtualizer({
    count: symbols.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useEffect(() => {
    if (!followActive.current || symbols.length === 0) return;
    followActive.current = false;
    virtualizerRef.current.scrollToIndex(active, { align: 'auto' });
  }, [active, followActive, symbols.length]);

  if (symbols.length === 0) {
    const message =
      catalogState === 'loading'
        ? 'در حال بارگذاری نمادها…'
        : catalogState === 'empty'
          ? 'فهرست نمادها از سرور نرسید'
          : 'نمادی پیدا نشد';
    return <p className="py-6 text-center font-sans text-xs text-slate-400">{message}</p>;
  }

  return (
    <div ref={listRef} className="h-72 overflow-y-auto overscroll-contain p-1 font-sans">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = symbols[virtualRow.index];
          if (!item) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute start-0 top-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <SymbolRow
                item={item}
                selected={virtualRow.index === active}
                chosen={pickedSymbol !== '' && fold(item.symbol) === fold(pickedSymbol)}
                onHover={() => onActive(virtualRow.index)}
                onChoose={() => onChoose(item)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SymbolRow({
  item,
  selected,
  chosen,
  onHover,
  onChoose,
}: {
  item: SymbolItem;
  selected: boolean;
  chosen: boolean;
  onHover: () => void;
  onChoose: () => void;
}) {
  const price = sharePrice(item);
  const change = changeLabel(item);
  return (
    <Button
      type="button"
      variant="ghost"
      aria-selected={chosen}
      className={cn(
        'relative h-auto w-full flex-col items-stretch gap-0.5 whitespace-normal rounded-md py-1.5 pe-8 ps-2 text-start font-sans font-normal hover:bg-white/10',
        selected && 'bg-white/10'
      )}
      onMouseEnter={onHover}
      onClick={onChoose}
    >
      {chosen ? <Check className="absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" /> : null}
      <span className="flex items-baseline gap-2">
        <span className="shrink-0 font-bold">{item.symbol}</span>
        <span className="truncate font-normal text-slate-400">{item.name}</span>
      </span>
      <span className="flex gap-x-3 overflow-hidden text-[10px] font-normal text-nowrap text-slate-400">
        {item.market ? <span>{item.market}</span> : null}
        {price != null ? (
          <span>
            <Num className="text-slate-200">{formatNumber(price)}</Num>
            <span className="ms-1">ریال</span>
            <span className="ms-1 text-slate-500">
              (<Num>{formatNumber(tomanFromRial(price))}</Num> تومان)
            </span>
          </span>
        ) : (
          <span>قیمت: —</span>
        )}
        {change ? (
          <span className={change.tone}>
            <Num>{change.text.replace(/%$/, '')}</Num>%
          </span>
        ) : null}
        {item.pMax != null && item.pMax > 0 ? (
          <span>
            سقف <Num>{formatNumber(item.pMax)}</Num>
          </span>
        ) : null}
        {item.pMin != null && item.pMin > 0 ? (
          <span>
            کف <Num>{formatNumber(item.pMin)}</Num>
          </span>
        ) : null}
        {item.volume != null ? (
          <span>
            حجم <Num>{formatNumber(item.volume)}</Num>
          </span>
        ) : null}
        {item.baseVolume != null && Number.isFinite(item.baseVolume) ? (
          <span>
            حجم مبنا <Num>{formatNumber(item.baseVolume)}</Num>
          </span>
        ) : (
          <span>حجم مبنا —</span>
        )}
      </span>
    </Button>
  );
}
