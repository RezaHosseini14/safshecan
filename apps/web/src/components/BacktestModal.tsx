'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  BarChart2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Wifi,
  Layers,
  Sliders,
  Search,
  Award,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Shuffle,
  Database,
  Server,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  BacktestReport,
  HistoricalBacktestReport,
  HistoricalTradeResult,
  HistoricalIPO,
} from '../types';
import { formatNumberEn } from '../lib/security';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BacktestModal({ isOpen, onClose }: BacktestModalProps) {
  const [activeTab, setActiveTab] = useState<'historical' | 'opening' | 'montecarlo' | 'brokers'>('historical');

  // Historical Backtest Config State
  const [capitalToman, setCapitalToman] = useState<number>(50_000_000);
  const [allocationMode, setAllocationMode] = useState<'percent' | 'fixed' | 'kelly' | 'risk_parity'>('percent');
  const [positionPercent, setPositionPercent] = useState<number>(30);
  const [fixedAllocToman, setFixedAllocToman] = useState<number>(10_000_000);
  const [connectionType, setConnectionType] = useState<'datacenter' | 'fiber' | 'mobile4g' | 'adsl'>('fiber');
  const [brokerOMS, setBrokerOMS] = useState<string>('auto');
  const [burstCount, setBurstCount] = useState<number>(5);
  const [burstIntervalMs, setBurstIntervalMs] = useState<number>(2.5);
  const [leadTimeMs, setLeadTimeMs] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Opening Bell Config State
  const [openingRuns, setOpeningRuns] = useState<number>(5);

  // Results & Loading State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historicalReport, setHistoricalReport] = useState<HistoricalBacktestReport | null>(null);
  const [openingReport, setOpeningReport] = useState<BacktestReport | null>(null);
  const [allIPOs, setAllIPOs] = useState<HistoricalIPO[]>([]);
  const [brokerProfiles, setBrokerProfiles] = useState<Record<string, any>>({});

  const loadInitialData = async () => {
    try {
      const [iposRes, brokersRes] = await Promise.all([
        api.getHistoricalIPOs().catch(() => ({ ipos: [] })),
        api.getBrokerProfiles().catch(() => ({ brokers: {} })),
      ]);
      if (iposRes && iposRes.ipos) {
        setAllIPOs(iposRes.ipos);
      }
      if (brokersRes && brokersRes.brokers) {
        setBrokerProfiles(brokersRes.brokers);
      }
    } catch {
      // ignore
    }
  };

  // Initial load of metadata
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Run Historical Backtest
  const handleRunHistorical = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const parsedLead = leadTimeMs.trim() !== '' ? Number(leadTimeMs) : undefined;
      const res = await api.runHistoricalBacktest({
        initialCapitalToman: capitalToman,
        allocationMode,
        positionSizingPercent: positionPercent,
        fixedAllocationToman: fixedAllocToman,
        connectionType,
        brokerOMS,
        leadTimeMs: parsedLead,
        burstCount,
        burstIntervalMs,
        targetSectors: selectedSector !== 'ALL' ? [selectedSector] : undefined,
        includeMonteCarlo: true,
        monteCarloIterations: 150,
      });

      if (res && res.report) {
        setHistoricalReport(res.report);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در اجرای شبیه‌ساز تاریخی');
    } finally {
      setLoading(false);
    }
  };

  // Run Opening Bell Simulator
  const handleRunOpening = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.runOpeningBacktest(openingRuns);
      if (res && res.report) {
        setOpeningReport(res.report);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در اجرای شبیه‌ساز بازگشایی');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    allIPOs.forEach((item) => {
      if (item.sector) set.add(item.sector);
    });
    return Array.from(set);
  }, [allIPOs]);

  // Filtered trades for table
  const filteredTrades = useMemo(() => {
    if (!historicalReport?.trades) return [];
    return historicalReport.trades.filter((t) => {
      const matchSearch =
        !searchFilter.trim() ||
        t.symbol.includes(searchFilter) ||
        t.name.includes(searchFilter) ||
        (t.sector && t.sector.includes(searchFilter));
      return matchSearch;
    });
  }, [historicalReport, searchFilter]);

  // SVG Chart points calculation
  const chartData = useMemo(() => {
    if (!historicalReport?.equityCurve || historicalReport.equityCurve.length < 2) return null;
    const curve = historicalReport.equityCurve;
    const values = curve.map((c) => c.portfolioValueToman);
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;

    const width = 680;
    const height = 160;

    const points = curve.map((c, i) => {
      const x = (i / (curve.length - 1)) * width;
      const y = height - ((c.portfolioValueToman - minVal) / range) * (height - 20) - 10;
      return { x, y, value: c.portfolioValueToman, date: c.date, symbol: c.symbol };
    });

    const pathString = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const areaString = `${pathString} L ${width} ${height} L 0 ${height} Z`;

    return { points, pathString, areaString, minVal, maxVal, width, height };
  }, [historicalReport]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shadow-sm">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <span>موتور شبیه‌سازی کوانت و بک‌تست HFT بورس</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  نسخه ۲.۵ جامع
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                شبیه‌سازی میکروثانیه‌ای هسته PAM، ریزساختار صف، کارنامه تاریخی و تحلیل مونت‌کارلو
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-3 border-b border-border/60 bg-muted/20">
            <TabsList className="w-full grid grid-cols-4 h-10 p-1 bg-black/[0.04] dark:bg-white/[0.04]">
              <TabsTrigger value="historical" className="text-xs font-bold gap-1.5 data-[state=active]:bg-card">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>بک‌تست تاریخی پورتفوی</span>
              </TabsTrigger>
              <TabsTrigger value="opening" className="text-xs font-bold gap-1.5 data-[state=active]:bg-card">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>شبیه‌ساز زنگ بازگشایی (HFT)</span>
              </TabsTrigger>
              <TabsTrigger value="montecarlo" className="text-xs font-bold gap-1.5 data-[state=active]:bg-card">
                <Shuffle className="w-3.5 h-3.5 text-amber-500" />
                <span>تحلیل استرس مونت‌کارلو</span>
              </TabsTrigger>
              <TabsTrigger value="brokers" className="text-xs font-bold gap-1.5 data-[state=active]:bg-card">
                <Server className="w-3.5 h-3.5 text-indigo-500" />
                <span>ماتریس OMS کارگزاری‌ها</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* 1. HISTORICAL BACKTEST TAB */}
            <TabsContent value="historical" className="space-y-5 mt-0 focus-visible:outline-none">
              {/* Parameter Controls Panel */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-500" />
                    <span className="font-bold text-foreground text-sm">پارامترهای مالی و زیرساخت شبکه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      مجموع داده‌های واقعی: <b className="text-foreground">{allIPOs.length || 39} نماد</b>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Initial Capital */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground block">سرمایه اولیه (تومان)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={capitalToman}
                        onChange={(e) => setCapitalToman(Number(e.target.value))}
                        className="font-mono font-bold text-right h-9 text-xs"
                      />
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[20, 50, 100, 200].map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCapitalToman(amt * 1_000_000)}
                          className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          {amt}M
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Position Sizing Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground block">استراتژی مدیریت سرمایه</label>
                    <Select
                      value={allocationMode}
                      onValueChange={(val) => setAllocationMode(val as any)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">درصدی از پورتفوی جاری (Fixed %)</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت هر معامله (Fixed Cash)</SelectItem>
                        <SelectItem value="kelly">معیار کلی بهینه (Half-Kelly Criterion)</SelectItem>
                        <SelectItem value="risk_parity">تسهیم ریسک رقابت (Risk-Adjusted)</SelectItem>
                      </SelectContent>
                    </Select>
                    {allocationMode === 'percent' ? (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>تخصیص در هر سهم:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">{positionPercent}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>مبلغ ثابت هر سهم:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
                          {formatNumberEn(fixedAllocToman / 1_000_000)} میلیون
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connection Profile */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground block">پروفایل اتصال و اینترنت</label>
                    <Select
                      value={connectionType}
                      onValueChange={(val) => setConnectionType(val as any)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="datacenter">⚡ سرور دیتاسنتر تهران (پینگ ۲ms | جیتر ۰.۴ms)</SelectItem>
                        <SelectItem value="fiber">🌐 فیبر نوری تانوما / VDSL (پینگ ۱۶ms | جیتر ۲ms)</SelectItem>
                        <SelectItem value="mobile4g">📶 اینترنت همراه 4G LTE (پینگ ۴۴ms | جیتر ۶ms)</SelectItem>
                        <SelectItem value="adsl">📞 اینترنت خانگی ADSL (پینگ ۷۵ms | جیتر ۱۴ms)</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      {connectionType === 'datacenter' && 'حداکثر شانس تصاحب رتبه ۱ در ثانیه صفر'}
                      {connectionType === 'fiber' && 'گزینه ایده‌آل کاربران خانگی با ثبات بالا'}
                      {connectionType === 'mobile4g' && 'نیازمند کالیبراسیون دقیق لیدتایم ۲۰ms'}
                      {connectionType === 'adsl' && 'نوسان زیاد جیتر؛ پیشنهاد تیرهای رگباری بیشتر'}
                    </span>
                  </div>

                  {/* Broker OMS Gateway */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground block">هسته OMS کارگزاری</label>
                    <Select
                      value={brokerOMS}
                      onValueChange={(val) => setBrokerOMS(val)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🎯 هوشمند اتوماتیک (بهترین هسته)</SelectItem>
                        <SelectItem value="tadbir">تدبیرپرداز (مفید / سامان / بانک ملی)</SelectItem>
                        <SelectItem value="rayan">رایان بورس (مبین / پاسارگاد / تجارت)</SelectItem>
                        <SelectItem value="dotin">داتین نسل جدید (فارابی / خاورمیانه)</SelectItem>
                        <SelectItem value="asan">آسان بورس (کاریزما / کیان)</SelectItem>
                        <SelectItem value="sahra">صحرا (آگاه / سینا)</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      تاخیر اعتبارسنجی درونی و سهمیه در هسته معاملات
                    </span>
                  </div>
                </div>

                {/* Additional Tuning Row */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">شلیک رگباری:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={burstCount}
                        onChange={(e) => setBurstCount(Number(e.target.value))}
                        className="w-20 accent-sky-500"
                      />
                      <span className="font-mono font-bold text-foreground">{burstCount} تیر</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">فاصله شلیک:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={burstIntervalMs}
                        onChange={(e) => setBurstIntervalMs(Number(e.target.value))}
                        className="w-20 accent-sky-500"
                      />
                      <span className="font-mono font-bold text-foreground">{burstIntervalMs}ms</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">فیلتر گروه:</span>
                      <Select
                        value={selectedSector}
                        onValueChange={(val) => setSelectedSector(val)}
                      >
                        <SelectTrigger className="h-7 text-[11px] w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">تمامی صنایع ({allIPOs.length})</SelectItem>
                          {sectors.map((sec) => (
                            <SelectItem key={sec} value={sec}>
                              {sec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleRunHistorical}
                    disabled={loading}
                    variant="default"
                    size="sm"
                    className="font-bold gap-2 px-5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white shadow-md shadow-emerald-500/20"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{loading ? 'در حال شبیه‌سازی ریزساختار...' : 'اجرای کارنامه کوانت تاریخی'}</span>
                  </Button>
                </div>
              </div>

              {/* Historical Report Output */}
              {historicalReport && (
                <div className="space-y-4">
                  {/* Top Quantitative Performance Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {/* Net PnL */}
                    <div className="p-3 rounded-2xl bg-card border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>سود خالص کل</span>
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      </span>
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                        +{formatNumberEn(historicalReport.summary.totalNetProfitToman)} T
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold block">
                        +{historicalReport.summary.portfolioTotalReturnPercent}% بازدهی
                      </span>
                    </div>

                    {/* Ending Capital */}
                    <div className="p-3 rounded-2xl bg-card border border-sky-500/30 space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>ارزش نهایی پورتفو</span>
                        <Award className="w-3 h-3 text-sky-500" />
                      </span>
                      <div className="font-mono font-black text-sky-600 dark:text-sky-400 text-base">
                        {formatNumberEn(historicalReport.summary.endingCapitalToman)} T
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        سرمایه اولیه: {formatNumberEn(historicalReport.summary.initialCapitalToman / 1_000_000)}M
                      </span>
                    </div>

                    {/* Sharpe Ratio */}
                    <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>نسبت شارپ (Sharpe)</span>
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                      </span>
                      <div className="font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                        {historicalReport.summary.sharpeRatio}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        سورتینو: {historicalReport.summary.sortinoRatio}
                      </span>
                    </div>

                    {/* Fill & Win Rate */}
                    <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>نرخ تصاحب سرخطی</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </span>
                      <div className="font-mono font-black text-foreground text-base">
                        {historicalReport.summary.fillSuccessRatePercent}%
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {historicalReport.summary.filledTradesCount} خرید کامل + {historicalReport.summary.partialTradesCount} جزئی
                      </span>
                    </div>

                    {/* Max Drawdown */}
                    <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>حداکثر افت (Max DD)</span>
                        <TrendingDown className="w-3 h-3 text-rose-500" />
                      </span>
                      <div className="font-mono font-black text-rose-600 dark:text-rose-400 text-base">
                        {historicalReport.summary.maxDrawdownPercent}%
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        طول ریکاوری: {historicalReport.summary.maxDrawdownDurationDays} روز
                      </span>
                    </div>

                    {/* Profit Factor & Latency */}
                    <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
                      <span className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>نسبت سود/زیان (PF)</span>
                        <Zap className="w-3 h-3 text-indigo-500" />
                      </span>
                      <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                        {historicalReport.summary.profitFactor}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        تاخیر P50: {historicalReport.summary.latencyStats.p50Ms}ms
                      </span>
                    </div>
                  </div>

                  {/* Interactive Equity Curve & Drawdown SVG Chart */}
                  {chartData && (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-foreground text-xs">نمودار رشد ارزش پورتفو و کانال اطمینان</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                            رشد واقعی پورتفو
                          </span>
                          {historicalReport.monteCarlo && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-500/60 inline-block" />
                              کانال ۹۵٪ مونت‌کارلو ({historicalReport.monteCarlo.percentile95ReturnPercent}%+)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full overflow-hidden bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 border border-border/50">
                        <svg
                          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                          className="w-full h-40 overflow-visible"
                        >
                          <defs>
                            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="20" x2={chartData.width} y2="20" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                          <line x1="0" y1="80" x2={chartData.width} y2="80" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                          <line x1="0" y1="140" x2={chartData.width} y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />

                          {/* Area Fill */}
                          <path d={chartData.areaString} fill="url(#equityGrad)" />

                          {/* Stroke Line */}
                          <path
                            d={chartData.pathString}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Points */}
                          {chartData.points.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={i === chartData.points.length - 1 ? 4 : 2}
                              fill={i === chartData.points.length - 1 ? '#059669' : '#10b981'}
                              className="transition-all hover:r-4"
                            />
                          ))}
                        </svg>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                          <span>نقطه شروع: {formatNumberEn(chartData.minVal / 1_000_000)}M تومان</span>
                          <span>مقطع کنونی: ۳۹ معامله تاریخی</span>
                          <span className="text-emerald-500 font-bold">
                            اوج دارایی: {formatNumberEn(chartData.maxVal / 1_000_000)}M تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trades Log Table */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-sky-500" />
                        <span className="font-bold text-foreground text-xs">دفتر کل معاملات و رفتار صف PAM ({filteredTrades.length} سهم)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-44">
                          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground" />
                          <Input
                            placeholder="جستجوی نماد، صنعت..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="h-8 pr-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto border border-border/60 rounded-xl">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-16">نماد</TableHead>
                            <TableHead>نام شرکت و گروه</TableHead>
                            <TableHead>تاریخ عرضه</TableHead>
                            <TableHead className="text-center">تیر برنده</TableHead>
                            <TableHead className="text-center">رتبه در صف</TableHead>
                            <TableHead className="text-center">وضعیت خرید</TableHead>
                            <TableHead className="text-right">سود/زیان خالص</TableHead>
                            <TableHead className="text-right">بازدهی</TableHead>
                            <TableHead>تحلیل ریزساختار خروج</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrades.map((t, idx) => {
                            const isFilled = t.fillStatus === 'FILLED';
                            const isPartial = t.fillStatus === 'PARTIAL';
                            const isMissed = t.fillStatus === 'NOT_FILLED';

                            return (
                              <TableRow key={idx} className="hover:bg-muted/30">
                                <TableCell className="font-black text-foreground">{t.symbol}</TableCell>
                                <TableCell>
                                  <div className="font-medium text-foreground">{t.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{t.sector}</div>
                                </TableCell>
                                <TableCell className="font-mono text-muted-foreground text-[11px]">
                                  {t.listingDate}
                                </TableCell>
                                <TableCell className="text-center font-mono">
                                  {t.winningShotIndex > 0 ? (
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      #{t.winningShotIndex}
                                    </Badge>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-mono font-bold">
                                  {t.simulatedQueueRank <= 5 ? (
                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                      🥇 #{t.simulatedQueueRank}
                                    </Badge>
                                  ) : t.simulatedQueueRank <= 25 ? (
                                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px]">
                                      🥈 #{t.simulatedQueueRank}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">#{t.simulatedQueueRank}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isFilled && (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                      خرید ۱۰۰٪
                                    </Badge>
                                  )}
                                  {isPartial && (
                                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px]">
                                      جزئی ({t.fillRatePercent}٪)
                                    </Badge>
                                  )}
                                  {isMissed && (
                                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                      نرسید
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  {t.netProfitToman > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      +{formatNumberEn(t.netProfitToman)} T
                                    </span>
                                  ) : t.netProfitToman < 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      {formatNumberEn(t.netProfitToman)} T
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">۰ T</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  {t.tradeReturnPercent > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      +{t.tradeReturnPercent}%
                                    </span>
                                  ) : t.tradeReturnPercent < 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      {t.tradeReturnPercent}%
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">۰%</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground max-w-xs truncate" title={t.exitReason}>
                                  {t.exitReason}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 2. OPENING BELL HFT SIMULATOR TAB */}
            <TabsContent value="opening" className="space-y-5 mt-0 focus-visible:outline-none">
              {/* Controls */}
              <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-sm block">شبیه‌ساز فوق‌سریع زنگ بازگشایی بازار (Opening Bell)</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    آزمون استرس تایمینگ میکروثانیه‌ای، بررسی انحراف جیتر و شبیه‌سازی صف ورود به PAM
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">دورهای آزمون:</span>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={openingRuns}
                    onChange={(e) => setOpeningRuns(Number(e.target.value))}
                    className="w-24 accent-sky-500"
                  />
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">{openingRuns} بار</span>
                  <Button
                    type="button"
                    onClick={handleRunOpening}
                    disabled={loading}
                    variant="cyan"
                    size="sm"
                    className="font-bold gap-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{loading ? 'در حال آزمون استرس...' : 'شروع تست سرعت'}</span>
                  </Button>
                </div>
              </div>

              {/* HFT Architecture Pipeline diagram */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <span className="font-bold text-foreground block text-xs">خط لوله پردازش پکت از کلاینت تا هسته معاملات بورس (Order Lifecycle)</span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[11px]">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">01. OS Clock Timer</span>
                    <span className="font-bold text-foreground">تایمر سیستم‌عامل</span>
                    <span className="text-[10px] text-emerald-500 font-mono block">انحراف 0.0ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">02. Pre-Warm Socket</span>
                    <span className="font-bold text-foreground">سوکت داغ TCP/TLS</span>
                    <span className="text-[10px] text-sky-500 font-mono block">Zero Handshake</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">03. ISP Transmission</span>
                    <span className="font-bold text-foreground">انتقال فیبر نوری</span>
                    <span className="text-[10px] text-foreground font-mono block">Half-RTT Transit</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">04. Broker OMS</span>
                    <span className="font-bold text-foreground">صف پردازش کارگزار</span>
                    <span className="text-[10px] text-indigo-500 font-mono block">Serialization ~1ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-mono">05. TSE PAM Core</span>
                    <span className="font-bold text-foreground">هسته بورس تهران</span>
                    <span className="text-[10px] text-amber-500 font-mono block">Atomic Time-Slice</span>
                  </div>
                </div>
              </div>

              {/* Opening Results */}
              {openingReport && (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-card border border-emerald-500/30">
                      <span className="text-[10px] text-muted-foreground block">نرخ قبولی سفارشات در صف</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xl">
                        {openingReport.summary.successRate}%
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-card border border-sky-500/30">
                      <span className="text-[10px] text-muted-foreground block">میانگین تاخیر شبکه کل</span>
                      <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xl">
                        {openingReport.summary.avgLatencyMs} ms
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-card border border-amber-500/30">
                      <span className="text-[10px] text-muted-foreground block">بهترین رتبه کسب‌شده</span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xl">
                        🥇 #{openingReport.summary.bestRankEstimate}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-card border border-border">
                      <span className="text-[10px] text-muted-foreground block">شانس رتبه طلایی (۱ الی ۵)</span>
                      <span className="font-mono font-black text-foreground text-xl">
                        {openingReport.summary.goldenRankRatePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Multi-Network Scenario Breakdown */}
                  {openingReport.scenarios && openingReport.scenarios.length > 0 && (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                      <span className="font-bold text-foreground text-xs block">
                        ماتریس کالیبراسیون و نتایج سناریوهای شبکه اینترنت ایران
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {openingReport.scenarios.map((sc, i) => (
                          <div key={i} className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-xs">{sc.scenarioName}</span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                پینگ: {sc.pingMs}ms
                              </Badge>
                            </div>
                            <div className="divide-y divide-border/40 text-[11px]">
                              {sc.testedLeadTimes.map((lt, lidx) => (
                                <div key={lidx} className="py-1 flex items-center justify-between">
                                  <span className="font-mono text-muted-foreground">لیدتایم {lt.leadTimeMs}ms:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold font-mono">
                                      رتبه ۱-۵: {lt.topRankSuccessRate}%
                                    </span>
                                    {lt.earlyRejectionCount > 0 && (
                                      <span className="text-rose-500 font-mono text-[10px]">
                                        ({lt.earlyRejectionCount} ریجکت)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                              💡 <b>توصیه:</b> {sc.recommendationReason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Live Simulated Shots */}
                  {openingReport.runs && openingReport.runs.length > 0 && (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                      <span className="font-bold text-foreground text-xs block">پکت‌های ثبت‌شده در هسته معاملات</span>
                      <div className="divide-y divide-border/60">
                        {openingReport.runs.map((r) => (
                          <div key={r.runIndex} className="py-2 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                شلیک #{r.runIndex}
                              </Badge>
                              <span className="text-muted-foreground">{r.packetSummary}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-muted-foreground">تاخیر: {r.bestLatencyMs}ms</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                رتبه هسته: #{r.estimatedQueuePosition}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* 3. MONTE CARLO RISK ANALYSIS TAB */}
            <TabsContent value="montecarlo" className="space-y-4 mt-0 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm block">شبیه‌سازی آماری تصادفی مونت‌کارلو (Monte Carlo Multi-Path Engine)</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      بررسی ۱۵۰ چرخه هم‌زمان با اعمال نوسانات تصادفی پینگ و تاخیر سرور جهت محاسبه ریسک تباهی
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRunHistorical}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="gap-2 font-bold"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>بازاجرای شبیه‌سازی</span>
                  </Button>
                </div>

                {historicalReport?.monteCarlo ? (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-foreground block">احتمال بازدهی مثبت</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xl">
                          {historicalReport.monteCarlo.probabilityOfProfitPercent}%
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-foreground block">بازدهی میانه (Median)</span>
                        <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xl">
                          +{historicalReport.monteCarlo.medianReturnPercent}%
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-foreground block">بدترین سناریو (VaR 95%)</span>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xl">
                          {historicalReport.monteCarlo.percentile5ReturnPercent}%
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-foreground block">بهترین سناریو (Top 5%)</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xl">
                          +{historicalReport.monteCarlo.percentile95ReturnPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2 text-[11px]">
                      <span className="font-bold text-foreground block">نتایج سنجش ریسک کوانت:</span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>
                          در ۹۵٪ شرایط ممکن، بازدهی پورتفو از <b className="text-foreground font-mono">{historicalReport.monteCarlo.percentile5ReturnPercent}%</b> بیشتر خواهد بود.
                        </li>
                        <li>
                          حداکثر افت سرمایه احتمالی در شرایط نوسان شدید شبکه: <b className="text-rose-500 font-mono">{historicalReport.monteCarlo.monteCarloDrawdown95Percent}%</b>.
                        </li>
                        <li>
                          با توجه به بازدهی میانگین <b className="text-emerald-500 font-mono">+{historicalReport.monteCarlo.medianReturnPercent}%</b>، استراتژی دارای برتری آماری قطعی (Positive Expectancy) در هسته بورس است.
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    برای مشاهده تحلیل احتمالاتی، دکمه «اجرای کارنامه کوانت تاریخی» را در برگه اول بزنید.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 4. BROKER OMS MATRIX TAB */}
            <TabsContent value="brokers" className="space-y-4 mt-0 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <span className="font-bold text-foreground text-sm block">ماتریس مقایسه‌ای هسته‌های OMS کارگزاری‌های بورس تهران</span>
                <span className="text-[11px] text-muted-foreground block">
                  ویژگی‌های تاخیر سخت‌افزاری، صف اعتبارسنجی داخلی و سهمیه دسترسی به سامانه معاملاتی PAM
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">۱. تدبیرپرداز (Tadbir Engine)</span>
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
                        سریع‌ترین هسته
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      استفاده شده در <b>مفید، سامان، اقتصاد بیدار و بانک ملی</b>. کمترین تاخیر اعتبارسنجی (حدود ۱.۲ms) و ظرفیت صف ۲۰ شلیک در ۱۰۰ms. بهترین گزینه برای سرخطی عرضه‌های اولیه سنگین.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">۲. داتین نسل جدید (Dotin Core)</span>
                      <Badge variant="outline" className="text-sky-600 dark:text-sky-400 bg-sky-500/10 text-[10px]">
                        معماری نوین
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      مورد استفاده در <b>فارابی و بانک پاسارگاد</b>. زمان پاسخ‌دهی متوسط ۱.۷ms با ثبات بالا در مواجهه با قطعی‌های احتمالی.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">۳. رایان هم‌افزا (Rayan Bourse)</span>
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px]">
                        پراستفاده‌ترین
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      مورد استفاده در <b>مبین سرمایه، پاسارگاد، تجارت و سهم آشنا</b>. تاخیر اعتبارسنجی درونی ۲.۲ms همراه با خطوط سهمیه متوازن.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">۴. صحرا (Sahra Engine)</span>
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        کارگزاری آگاه
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      هسته اختصاصی <b>کارگزاری آگاه و سینا</b>. تاخیر اعتبارسنجی حدود ۳.۲ms؛ نیازمند تنظیم لیدتایم کمی بزرگتر برای جبران تاخیر صف داخلی کارگزاری.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-5 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
