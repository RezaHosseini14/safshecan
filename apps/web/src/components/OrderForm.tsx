'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  Coins,
  Layers,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  Zap,
  Calendar,
  Flame,
  Info,
} from 'lucide-react';
import { OrderConfig, SymbolItem, BrokerType, AccountInfo, SymbolsSyncStatus } from '../types';
import { formatNumberEn } from '../lib/security';
import { api } from '../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderFormProps {
  orderConfig: OrderConfig;
  accountInfo?: AccountInfo;
  onChange: (updated: Partial<OrderConfig>) => void;
  onApplyPreset?: (presetId: BrokerType) => Promise<void>;
}

type FilterTab = 'ALL' | 'IPOS' | 'BOURSE' | 'FARABOURSE';

export function OrderForm({
  orderConfig,
  accountInfo,
  onChange,
  onApplyPreset,
}: OrderFormProps) {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState<boolean>(false);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [loadingSymbols, setLoadingSymbols] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SymbolsSyncStatus | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load symbols and status on mount
  const loadSymbolsData = async () => {
    try {
      setLoadingSymbols(true);
      const [symbolsData, statusData] = await Promise.all([
        api.getSymbols(),
        api.getSymbolsStatus().catch(() => null),
      ]);
      if (Array.isArray(symbolsData)) {
        setSymbols(symbolsData);
      }
      if (statusData) {
        setSyncStatus(statusData);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSymbols(false);
    }
  };

  useEffect(() => {
    loadSymbolsData();
  }, []);

  // Manual real-time sync with TSETMC
  const handleLiveRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      setSyncFeedback('در حال همگام‌سازی لحظه‌ای با TSETMC...');
      const res = await api.refreshSymbols();
      if (res.success) {
        setSyncFeedback(`✓ ${res.totalSymbols} نماد و ${res.ipoCount} عرضه اولیه بروزرسانی شدند`);
        await loadSymbolsData();
      } else {
        setSyncFeedback(res.message || 'خطا در همگام‌سازی');
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'خطا در ارتباط با سرور بورس');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSymbolDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Computed total count of IPOs
  const ipoSymbolsCount = useMemo(() => {
    return symbols.filter((s) => s.isIpo).length;
  }, [symbols]);

  // Current selected symbol item
  const currentSymbolItem = useMemo(() => {
    return symbols.find((s) => s.symbol === orderConfig.symbol);
  }, [symbols, orderConfig.symbol]);

  // Filter symbols based on active tab and search query
  const filteredSymbols = useMemo(() => {
    const q = symbolSearchQuery.trim().toLowerCase();

    return symbols.filter((s) => {
      // 1. Tab filtering
      if (activeTab === 'IPOS' && !s.isIpo) return false;
      if (activeTab === 'BOURSE' && s.market !== 'بورس') return false;
      if (activeTab === 'FARABOURSE' && s.market !== 'فرابورس' && s.market !== 'پایه فرابورس') return false;

      // 2. Query filtering
      if (!q) return true;
      return (
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.isin && s.isin.toLowerCase().includes(q)) ||
        (s.group && s.group.toLowerCase().includes(q)) ||
        (s.ipoDetails?.title && s.ipoDetails.title.toLowerCase().includes(q))
      );
    });
  }, [symbols, activeTab, symbolSearchQuery]);

  const totalValueRials = orderConfig.price * orderConfig.quantity;
  const totalValueTomans = Math.floor(totalValueRials / 10);

  const handlePriceStep = (delta: number) => {
    const newPrice = Math.max(1, orderConfig.price + delta);
    onChange({ price: newPrice });
  };

  const handleMaxPricePreset = () => {
    // If symbol has real ceiling from TSETMC, use it; otherwise standard +7%
    if (currentSymbolItem?.pMax && currentSymbolItem.pMax > 0) {
      onChange({ price: currentSymbolItem.pMax });
    } else {
      const maxPrice = Math.round(orderConfig.price * 1.07);
      onChange({ price: maxPrice });
    }
  };

  const handleSelectSymbol = (item: SymbolItem) => {
    const updates: Partial<OrderConfig> = {
      symbol: item.symbol,
      isin: item.isin || orderConfig.isin,
    };

    // If it's an IPO and has a ceiling price, default to ceiling price for queuing
    if (item.isIpo && item.pMax && item.pMax > 0) {
      updates.price = item.pMax;
    } else if (item.price || item.pMax || item.highPrice) {
      updates.price = item.price || item.pMax || item.highPrice || orderConfig.price;
    }

    onChange(updates);
    setIsSymbolDropdownOpen(false);
  };

  return (
    <Card className="p-5 flex flex-col gap-5">
      {/* Header with Title and Live Sync Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-foreground block">مشخصات نماد و پارامترهای سفارش</span>
            <span className="text-[10px] text-muted-foreground">
              {symbols.length > 0
                ? `${formatNumberEn(symbols.length)} نماد لحظه‌ای بورس (${ipoSymbolsCount} عرضه اولیه)`
                : 'دریافت نمادهای لحظه‌ای بورس و فرابورس...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Sync Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLiveRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            title="بروزرسانی زنده نمادها و عرضه‌های اولیه از سامانه بورس (TSETMC)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>بروزرسانی لحظه‌ای بورس</span>
          </Button>

          <Badge variant="secondary" className="font-mono text-xs">
            ISIN: {orderConfig.isin || 'IRO1FAZR0001'}
          </Badge>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Symbol Selection with Rich Dropdown */}
        <div className="relative space-y-1.5" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <Label className="block">نماد بورسی هدف</Label>
            {currentSymbolItem?.isIpo && (
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                عرضه اولیه فعال
              </span>
            )}
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
              className="w-full h-11 rounded-xl px-3.5 text-right flex items-center justify-between text-foreground font-bold transition-all border border-border hover:border-emerald-500/50 bg-card/60"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-base">{orderConfig.symbol}</span>
                <span className="text-xs text-muted-foreground font-normal truncate max-w-[170px]">
                  {currentSymbolItem?.name || 'انتخاب شده'}
                </span>
                {currentSymbolItem?.isIpo && (
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] py-0 px-1.5 font-bold h-4">
                    عرضه اولیه
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </Button>

            {/* Dropdown Menu */}
            {isSymbolDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel border border-border rounded-2xl shadow-2xl p-3 max-h-[420px] flex flex-col gap-2.5 backdrop-blur-2xl">
                {/* Search Box */}
                <div className="relative">
                  <Input
                    type="text"
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    placeholder="جستجوی نماد، نام شرکت یا عرضه اولیه (شستا، فزر، زشک، فپردیس...)"
                    className="pr-9 text-xs"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                </div>

                {/* Filter Tabs using shadcn Tabs */}
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} dir="rtl" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 h-8 p-1 text-[11px]">
                    <TabsTrigger value="ALL" className="text-[11px] h-6 py-0 px-1">
                      همه ({symbols.length})
                    </TabsTrigger>
                    <TabsTrigger value="IPOS" className="text-[11px] h-6 py-0 px-1 gap-1 text-amber-600 dark:text-amber-400">
                      <Flame className="w-3 h-3" />
                      عرضه اولیه ({ipoSymbolsCount})
                    </TabsTrigger>
                    <TabsTrigger value="BOURSE" className="text-[11px] h-6 py-0 px-1">
                      بورس
                    </TabsTrigger>
                    <TabsTrigger value="FARABOURSE" className="text-[11px] h-6 py-0 px-1">
                      فرابورس
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Count Header */}
                <div className="text-[10px] text-muted-foreground flex items-center justify-between px-1">
                  <span>نمادهای یافت شده:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{filteredSymbols.length}</span>
                </div>

                {/* Symbols Scrollable List */}
                <div className="overflow-y-auto max-h-[260px] divide-y divide-border/60 flex flex-col text-xs pr-1">
                  {filteredSymbols.map((item) => {
                    const isSelected = orderConfig.symbol === item.symbol;
                    return (
                      <Button
                        key={item.isin || item.symbol}
                        type="button"
                        variant="ghost"
                        onClick={() => handleSelectSymbol(item)}
                        className={`w-full h-auto py-2 px-2.5 rounded-lg flex items-center justify-between text-right font-normal transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-foreground'
                            : 'hover:bg-black/5 dark:hover:bg-white/[0.06] text-foreground'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 text-right">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {item.symbol}
                            </span>
                            <span className="text-[11px] text-foreground truncate max-w-[150px]">
                              {item.name}
                            </span>
                            {item.isIpo && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                عرضه اولیه
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {item.group && <span>{item.group}</span>}
                            {item.pMax ? (
                              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                سقف: {formatNumberEn(item.pMax)}
                              </span>
                            ) : null}
                            {item.price ? (
                              <span className="font-mono">
                                قیمت: {formatNumberEn(item.price)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.market && (
                            <span className="text-[10px] bg-black/5 dark:bg-white/[0.05] px-1.5 py-0.5 rounded text-muted-foreground">
                              {item.market}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          )}
                        </div>
                      </Button>
                    );
                  })}

                  {filteredSymbols.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-xs flex flex-col items-center gap-1">
                      <Info className="w-5 h-5 text-muted-foreground/60" />
                      <span>نمادی با این عنوان یافت نشد</span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleLiveRefresh}
                        className="text-emerald-600 dark:text-emerald-400 text-[11px] h-auto p-0 hover:underline mt-1"
                      >
                        بروزرسانی مجدد دیتابیس بورس
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Broker Selector */}
        <div className="space-y-1.5">
          <Label className="block">سامانه کارگزاری</Label>
          <Select
            value={orderConfig.brokerType}
            onValueChange={(val) => {
              const broker = val as BrokerType;
              onChange({ brokerType: broker });
              onApplyPreset?.(broker);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب کارگزاری" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tadbir">تدبیرپرداز (آنلاین‌پلاس - سامان، فارابی، خوارزمی و...)</SelectItem>
              <SelectItem value="mofid">مفید (سامانه ایزی‌تریدر EasyTrader)</SelectItem>
              <SelectItem value="agah">آگاه (سامانه آسا ASA)</SelectItem>
              <SelectItem value="farabixo">فارابیکسو (Farabixo)</SelectItem>
              <SelectItem value="sahra">صحرا (سامانه برخط داتکس)</SelectItem>
              <SelectItem value="custom">سفارشی (استخراج خودکار از cURL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Input with +/- and Max */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>قیمت هر سهم (ریال)</Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleMaxPricePreset}
              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium hover:underline p-0 h-auto"
            >
              {currentSymbolItem?.pMax ? `تنظیم روی سقف مجاز (${formatNumberEn(currentSymbolItem.pMax)})` : 'تنظیم روی حداکثر (+۷٪)'}
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={orderConfig.price}
              onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
              className="text-sm font-mono text-cyan-600 dark:text-cyan-400 font-bold text-right h-10"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handlePriceStep(50)}
              title="افزایش ۵۰ ریال"
              className="h-10 w-10 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handlePriceStep(-50)}
              title="کاهش ۵۰ ریال"
              className="h-10 w-10 shrink-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>تعداد سهم (حجم)</Label>
            <div className="flex items-center gap-1">
              {[500, 1000, 5000].map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ quantity: q })}
                  className="text-[10px] h-6 px-2 text-foreground font-mono"
                >
                  {formatNumberEn(q)}
                </Button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            value={orderConfig.quantity}
            onChange={(e) => onChange({ quantity: Number(e.target.value) || 0 })}
            className="text-sm font-mono text-foreground font-bold text-right h-10"
          />
        </div>
      </div>

      {/* Selected IPO Alert Card (if current symbol is an IPO) */}
      {currentSymbolItem?.isIpo && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>{currentSymbolItem.ipoDetails?.title || `عرضه اولیه نماد ${orderConfig.symbol}`}</span>
            </div>
            {currentSymbolItem.ipoDetails?.dateStr && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono gap-1">
                <Calendar className="w-3 h-3" />
                {currentSymbolItem.ipoDetails.dateStr}
              </Badge>
            )}
          </div>

          {currentSymbolItem.ipoDetails?.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {currentSymbolItem.ipoDetails.description}
            </p>
          )}

          {currentSymbolItem.pMax && currentSymbolItem.pMax > 0 && orderConfig.price !== currentSymbolItem.pMax && (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleMaxPricePreset}
                className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                تنظیم فوری قیمت روی سقف مجاز ({formatNumberEn(currentSymbolItem.pMax)} ریال)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Total Valuation Row */}
      <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-muted-foreground">ارزش کل سفارش:</span>
          <span className="text-foreground font-bold text-sm">
            {formatNumberEn(totalValueRials)} ریال
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {formatNumberEn(totalValueTomans)} تومان
          </span>
        </div>

        {accountInfo && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>حساب:</span>
            <span className="text-foreground font-semibold">
              {accountInfo.title || accountInfo.customerId || 'معامله‌گر برخط'}
            </span>
            {accountInfo.brokerName && (
              <Badge variant="secondary" className="text-[10px]">
                {accountInfo.brokerName}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
