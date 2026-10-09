'use client';

import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { calculateBuyFee } from '@saf-shekan/core';
import type { BotConfig, SymbolItem } from '@saf-shekan/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber, tomanFromRial } from '@/lib/format';
import { api } from '@/lib/api';
import { OrderConfigSchema } from '@/lib/security';

const BROKERS = [
  { id: 'custom', label: 'سفارشی (استخراج خودکار از cURL)' },
  { id: 'mofid', label: 'مفید آنلاین' },
  { id: 'agah', label: 'آگاه ایزی‌تریدر' },
  { id: 'tadbir', label: 'تدبیرپرداز (فارابیکسو / صحرا)' },
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
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const order = config.order;
  const parsed = OrderConfigSchema.safeParse({
    symbol: order.symbol,
    price: order.price,
    quantity: order.quantity,
    brokerType: order.brokerType,
    side: order.side,
  });
  const fee = parsed.success ? calculateBuyFee(order.price, order.quantity) : null;

  useEffect(() => {
    const handle = setTimeout(() => {
      api.searchSymbols(query).then(setSymbols);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <article className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0f131c]/90 p-6 backdrop-blur-md">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold">مشخصات نماد و پارامترهای سفارش</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">تنظیم نماد هدف، قیمت، حجم و سامانه معاملاتی</p>
            </div>
          </div>
          <Badge className="num-mono">{order.isin ? `ISIN: ${order.isin}` : 'ISIN: —'}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">سامانه کارگزاری</Label>
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
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">نماد بورسی هدف</Label>
            <Input
              value={query}
              onChange={(event) => {
                setDraftQuery(event.target.value);
                onChange({ symbol: event.target.value.trim() });
              }}
            />
            {symbols.length > 0 ? (
              <div className="mt-1 max-h-28 overflow-auto rounded-lg border border-white/10 bg-[#141924]">
                {symbols.slice(0, 6).map((item) => (
                  <Button
                    key={item.isin || item.symbol}
                    type="button"
                    variant="ghost"
                    className="h-8 w-full justify-start rounded-none"
                    onClick={() => {
                      setDraftQuery(item.symbol);
                      onChange({ symbol: item.symbol, isin: item.isin });
                      setSymbols([]);
                    }}
                  >
                    {item.symbol} — {item.name}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>تعداد سهم (حجم)</Label>
              <div className="flex gap-1">
                {[5000, 1000, 500].map((qty) => (
                  <Button key={qty} type="button" variant="chip" onClick={() => onChange({ quantity: qty })}>
                    {formatNumber(qty)}
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
              <Label>قیمت هر سهم (ریال)</Label>
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
          <span className="block text-xs font-bold">ارزش کل سفارش</span>
          <span className="text-[10px] text-slate-400">شامل کارمزد تخمینی بورس تهران</span>
        </div>
        <div className="num-mono text-left" dir="ltr">
          <span className="text-base font-black text-emerald-400">{fee ? formatNumber(fee.netValue) : '—'}</span>
          <span className="ms-2 text-[11px] text-slate-400">ریال</span>
          <span className="ms-2 text-[11px] text-slate-500">
            {fee ? `(${formatNumber(tomanFromRial(fee.netValue))} تومان)` : ''}
          </span>
        </div>
      </div>
    </article>
  );
}
