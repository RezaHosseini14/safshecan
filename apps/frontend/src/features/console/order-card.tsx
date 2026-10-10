'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link2 } from 'lucide-react';
import { calculateBuyFee } from '@saf-shekan/core';
import type { BotConfig, SymbolItem } from '@saf-shekan/core';
import { Num } from '@/components/num';
import { SymbolPicker, sharePrice } from '@/components/symbol-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber, tomanFromRial } from '@/lib/format';
import { api } from '@/lib/api';
import { OrderConfigSchema } from '@/lib/security';

const BROKERS = [
  { id: 'custom', labelKey: 'broker.custom' },
  { id: 'mofid', labelKey: 'broker.mofid' },
  { id: 'agah', labelKey: 'broker.agah' },
  { id: 'tadbir', labelKey: 'broker.tadbir' },
] as const;

export function OrderCard({
  config,
  onChange,
  onApplyPreset,
}: {
  config: BotConfig;
  onChange: (patch: Partial<BotConfig['order']>) => void;
  onApplyPreset: (presetId: string) => void;
}) {
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const query = draftQuery ?? config.order.symbol;
  const [picked, setPicked] = useState<SymbolItem | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const quoteSeq = useRef(0);
  const t = useTranslations('console');
  const tc = useTranslations('common');
  const order = config.order;
  const parsed = OrderConfigSchema.safeParse({
    symbol: order.symbol,
    price: order.price,
    quantity: order.quantity,
    brokerType: order.brokerType,
    side: order.side,
  });
  const fee = parsed.success ? calculateBuyFee(order.price, order.quantity) : null;
  const ceiling = picked?.pMax;
  const shownPrice = livePrice ?? (picked ? sharePrice(picked) : null);

  useEffect(() => {
    return () => {
      quoteSeq.current = -1;
    };
  }, []);

  const selectSymbol = (item: SymbolItem) => {
    const seq = quoteSeq.current + 1;
    quoteSeq.current = seq;
    setDraftQuery(item.symbol);
    setPicked(item);
    setLivePrice(null);
    const catalogPrice = sharePrice(item);
    onChange({
      symbol: item.symbol,
      isin: item.isin,
      ...(catalogPrice != null ? { price: catalogPrice } : {}),
    });
    api.getMarketQuote(item.symbol).then((quote) => {
      if (quoteSeq.current !== seq) return;
      if (quote?.lastPrice != null && quote.lastPrice > 0) {
        setLivePrice(quote.lastPrice);
        onChange({ price: quote.lastPrice });
      }
    });
  };

  return (
    <article className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0f131c]/90 p-6 backdrop-blur-md">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold">{t('orderTitle')}</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">{t('orderHint')}</p>
            </div>
          </div>
          <Badge>
            ISIN: <Num>{order.isin || '—'}</Num>
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">{t('brokerSystem')}</Label>
            <Select
              value={BROKERS.some((item) => item.id === order.brokerType) ? order.brokerType : 'custom'}
              onValueChange={(value) => {
                onChange({ brokerType: value as BotConfig['order']['brokerType'] });
                if (value !== 'custom') onApplyPreset(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BROKERS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {t(item.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SymbolPicker
            label={t('targetSymbol')}
            value={query}
            onQueryChange={(next) => {
              setDraftQuery(next);
              onChange({ symbol: next.trim() });
              if (picked && next.trim() !== picked.symbol) {
                setPicked(null);
                setLivePrice(null);
              }
            }}
            onSelect={selectSymbol}
          />
        </div>
        {picked ? (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#141924] p-3 text-[11px] md:grid-cols-5">
            <SymbolFact label={t('lastPrice')} value={shownPrice} unit={tc('rial')} toman={shownPrice} />
            <SymbolFact label={t('ceiling')} value={ceiling != null && ceiling > 0 ? ceiling : null} unit={tc('rial')} />
            <SymbolFact label={t('floor')} value={picked.pMin != null && picked.pMin > 0 ? picked.pMin : null} unit={tc('rial')} />
            <SymbolFact label={t('tradedVolume')} value={picked.volume ?? null} unit={tc('share')} />
            <SymbolFact
              label={t('baseVolume')}
              value={picked.baseVolume != null && Number.isFinite(picked.baseVolume) ? picked.baseVolume : null}
              unit={tc('share')}
              empty={t('baseVolumeMissing')}
            />
          </div>
        ) : null}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{t('quantity')}</Label>
              <div className="flex gap-1">
                {[5000, 1000, 500].map((qty) => (
                  <Button key={qty} type="button" variant="chip" onClick={() => onChange({ quantity: qty })}>
                    <Num>{formatNumber(qty)}</Num>
                  </Button>
                ))}
              </div>
            </div>
            <Input
              className="num-mono text-center font-bold"
              dir="ltr"
              inputMode="numeric"
              value={order.quantity || ''}
              onChange={(event) => onChange({ quantity: Number(event.target.value.replace(/,/g, '')) || 0 })}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{t('priceRial')}</Label>
              {ceiling != null && ceiling > 0 ? (
                <Button type="button" variant="chip" onClick={() => onChange({ price: ceiling })}>
                  {t('applyCeiling')}
                </Button>
              ) : null}
            </div>
            <div className="flex h-10 overflow-hidden rounded-lg border border-white/10 bg-[#141924]">
              <Button type="button" variant="ghost" className="h-full w-9 rounded-none" onClick={() => onChange({ price: Math.max(1, order.price - 1) })}>
                −
              </Button>
              <Input
                className="num-mono h-full rounded-none border-0 text-center font-bold"
                dir="ltr"
                inputMode="numeric"
                value={order.price || ''}
                onChange={(event) => onChange({ price: Number(event.target.value.replace(/,/g, '')) || 0 })}
              />
              <Button type="button" variant="ghost" className="h-full w-9 rounded-none" onClick={() => onChange({ price: order.price + 1 })}>
                +
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3.5">
        <div>
          <span className="block text-xs font-bold">{t('orderValue')}</span>
          <span className="text-[10px] text-slate-400">{t('orderValueHint')}</span>
        </div>
        <div className="text-left" dir="ltr">
          <Num className="text-base font-black text-emerald-400">{fee ? formatNumber(fee.netValue) : '—'}</Num>
          <span className="ms-2 text-[11px] text-slate-400">{tc('rial')}</span>
          {fee ? (
            <span className="ms-2 text-[11px] text-slate-500">
              (<Num>{formatNumber(tomanFromRial(fee.netValue))}</Num> {tc('toman')})
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SymbolFact({
  label,
  value,
  unit,
  toman,
  empty = '—',
}: {
  label: string;
  value: number | null;
  unit: string;
  toman?: number | null;
  empty?: string;
}) {
  const tc = useTranslations('common');
  return (
    <div>
      <span className="block text-slate-400">{label}</span>
      {value != null ? (
        <Num className="font-bold text-slate-100">{formatNumber(value)}</Num>
      ) : (
        <span className="text-slate-100">{empty}</span>
      )}
      {value != null ? <span className="ms-1 text-slate-500">{unit}</span> : null}
      {toman != null ? (
        <span className="ms-1 text-slate-500">
          (<Num>{formatNumber(tomanFromRial(toman))}</Num> {tc('toman')})
        </span>
      ) : null}
    </div>
  );
}
