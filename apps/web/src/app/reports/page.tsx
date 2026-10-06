'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useSniperSocket } from '../../hooks/useSniperSocket';
import { ShotResult } from '../../types';
import { formatNumberEn, sanitizeHeadersForDisplay } from '../../lib/security';
import { api } from '../../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_INITIAL_SHOTS: ShotResult[] = [
  {
    shotIndex: 9842,
    timestamp: '08:44:59.982',
    latencyMs: 14.2,
    httpStatus: 200,
    success: true,
    trackingCode: 'TRK-984201-OK',
    symbol: 'فزر',
    broker: 'تدبیرپرداز',
    rawRequestPayload: JSON.stringify(
      { isin: 'IRO1FAZR0001', price: 25000, quantity: 500, side: 'BUY' },
      null,
      2
    ),
    rawResponsePayload: JSON.stringify(
      { success: true, trackingCode: 'TRK-984201-OK', queueRank: 1, message: 'سفارش در صدر صف خرید ثبت گردید' },
      null,
      2
    ),
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-TSE-Engine': 'Core-Matching-Engine-01',
    },
  },
  {
    shotIndex: 9843,
    timestamp: '08:44:59.985',
    latencyMs: 16.8,
    httpStatus: 200,
    success: true,
    trackingCode: 'TRK-984302-OK',
    symbol: 'فزر',
    broker: 'تدبیرپرداز',
    rawRequestPayload: JSON.stringify({ isin: 'IRO1FAZR0001', price: 25000, quantity: 500 }, null, 2),
    rawResponsePayload: JSON.stringify({ success: true, trackingCode: 'TRK-984302-OK', queueRank: 2 }, null, 2),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    shotIndex: 9844,
    timestamp: '08:44:59.988',
    latencyMs: 19.1,
    httpStatus: 200,
    success: true,
    trackingCode: 'TRK-984403-OK',
    symbol: 'فزر',
    broker: 'تدبیرپرداز',
    rawRequestPayload: JSON.stringify({ isin: 'IRO1FAZR0001', price: 25000, quantity: 500 }, null, 2),
    rawResponsePayload: JSON.stringify({ success: true, trackingCode: 'TRK-984403-OK', queueRank: 4 }, null, 2),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    shotIndex: 9845,
    timestamp: '08:44:59.992',
    latencyMs: 23.4,
    httpStatus: 400,
    success: false,
    errorMessage: 'سقف حجم مجاز سفارش تکمیل شده است',
    symbol: 'فزر',
    broker: 'مفید',
    rawRequestPayload: JSON.stringify({ isin: 'IRO1FAZR0001', price: 25000, quantity: 500000 }, null, 2),
    rawResponsePayload: JSON.stringify({ success: false, error: 'Maximum quota exceeded' }, null, 2),
    headers: { 'Content-Type': 'application/json' },
  },
  {
    shotIndex: 9846,
    timestamp: '08:44:59.996',
    latencyMs: 27.5,
    httpStatus: 200,
    success: true,
    trackingCode: 'TRK-984605-OK',
    symbol: 'بیوتیک',
    broker: 'آگاه',
    rawRequestPayload: JSON.stringify({ isin: 'IRO1BIOT0001', price: 18400, quantity: 1000 }, null, 2),
    rawResponsePayload: JSON.stringify({ success: true, trackingCode: 'TRK-984605-OK', queueRank: 1 }, null, 2),
    headers: { 'Content-Type': 'application/json' },
  },
];

export default function ReportsPage() {
  const { connected, engineState, timeSync } = useSniperSocket();

  const [shotsList, setShotsList] = useState<ShotResult[]>(MOCK_INITIAL_SHOTS);
  const [filterType, setFilterType] = useState<'all' | 'success' | 'failed' | 'fast'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [brokerFilter, setBrokerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Packet inspection dialog
  const [inspectedShot, setInspectedShot] = useState<ShotResult | null>(null);
  const [packetCopied, setPacketCopied] = useState<boolean>(false);

  // Load latest reports from API
  useEffect(() => {
    api
      .getReports()
      .then((res) => {
        if (res.results && res.results.length > 0) {
          setShotsList(res.results);
        }
      })
      .catch(() => {});
  }, []);

  // Filtered dataset
  const filteredShots = useMemo(() => {
    return shotsList.filter((shot) => {
      // Filter tab
      if (filterType === 'success' && !shot.success) return false;
      if (filterType === 'failed' && shot.success) return false;
      if (filterType === 'fast' && shot.latencyMs >= 20) return false;

      // Status dropdown
      if (statusFilter === 'success' && !shot.success) return false;
      if (statusFilter === 'error' && shot.success) return false;

      // Broker dropdown
      if (brokerFilter !== 'all' && shot.broker !== brokerFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = (shot.symbol || '').toLowerCase().includes(q);
        const matchTracking = (shot.trackingCode || '').toLowerCase().includes(q);
        const matchBroker = (shot.broker || '').toLowerCase().includes(q);
        const matchId = String(shot.shotIndex).includes(q);
        if (!matchSymbol && !matchTracking && !matchBroker && !matchId) return false;
      }

      return true;
    });
  }, [shotsList, filterType, searchQuery, brokerFilter, statusFilter]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredShots.length / itemsPerPage));
  const paginatedShots = filteredShots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary KPIs
  const totalShots = shotsList.length;
  const successfulShots = shotsList.filter((s) => s.success).length;
  const successRate = totalShots > 0 ? ((successfulShots / totalShots) * 100).toFixed(1) : '0';
  const avgLatency =
    totalShots > 0
      ? (shotsList.reduce((acc, s) => acc + s.latencyMs, 0) / totalShots).toFixed(1)
      : '0';

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['شناسه شلیک', 'نماد', 'کارگزاری', 'زمان', 'تاخیر (ms)', 'کد وضعیت', 'کد پیگیری / خطا'];
    const rows = filteredShots.map((s) => [
      s.shotIndex,
      s.symbol || 'فزر',
      s.broker || 'عمومی',
      s.timestamp,
      s.latencyMs,
      s.httpStatus,
      s.trackingCode || s.errorMessage || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafShekan-Report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPacket = () => {
    if (!inspectedShot) return;
    const content = JSON.stringify(
      {
        shotIndex: inspectedShot.shotIndex,
        symbol: inspectedShot.symbol,
        headers: sanitizeHeadersForDisplay(inspectedShot.headers || {}),
        request: inspectedShot.rawRequestPayload,
        response: inspectedShot.rawResponsePayload,
      },
      null,
      2
    );
    navigator.clipboard.writeText(content);
    setPacketCopied(true);
    setTimeout(() => setPacketCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-emerald-500/25 selection:text-emerald-500 dark:selection:text-emerald-300 bg-background text-foreground transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[550px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-[130px]" />
        <div className="absolute -bottom-20 left-1/3 w-[700px] h-[450px] bg-sky-600/5 dark:bg-sky-600/8 rounded-full blur-[160px]" />
      </div>

      <Header
        engineState={engineState}
        timeSync={timeSync}
        pingMs={timeSync?.rttMs || 18}
        connected={connected}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 w-full z-10 flex-1 space-y-6">
        {/* Page Title & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              <span>کارنامه، آرشیو و تحلیل آماری شلیک‌ها</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              بررسی میلی‌ثانیه‌ای کلیه بسته‌های ارسالی به هسته معاملات بورس و کارگزاری‌ها
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="font-semibold text-xs gap-1.5"
            >
              <Download className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span>خروجی اکسل (CSV)</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="font-bold text-xs gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ گزارش رسمی</span>
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">درصد موفقیت کلی شلیک‌ها</span>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 neon-text-emerald">
                {successRate}%
              </span>
              <span className="text-xs text-muted-foreground">
                {successfulShots} / {totalShots}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </Card>

          {/* KPI 2 */}
          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">میانگین تاخیر رفت‌وبرگشت (RTT)</span>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-sky-600 dark:text-sky-400 neon-text-cyan">
                {avgLatency} ms
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-300">Δ -14.2ms</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-sky-500 dark:bg-sky-400 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </Card>

          {/* KPI 3 */}
          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">بهترین رتبه صف کسب‌شده</span>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-400">#1</span>
              <Badge variant="amber" className="text-[11px]">
                صدر صف فزر
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">جایگاه ردیف اول ثبت شده در هسته</span>
          </Card>

          {/* KPI 4 */}
          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">مجموع حجم ریالی شلیک‌ها</span>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-xl md:text-2xl font-black text-foreground">
                ۴,۸۵۰,۰۰۰,۰۰۰
              </span>
              <span className="text-xs text-muted-foreground">ریال</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {successfulShots} تراکنش تایید شده
            </span>
          </Card>
        </div>

        {/* Filter Chips Bar */}
        <Card className="p-3 flex flex-wrap items-center justify-between gap-3 no-print">
          <Tabs
            value={filterType}
            onValueChange={(val) => setFilterType(val as any)}
            dir="rtl"
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-9">
              <TabsTrigger value="all" className="text-xs">همه شلیک‌ها</TabsTrigger>
              <TabsTrigger value="success" className="text-xs">شلیک‌های موفق (200 OK)</TabsTrigger>
              <TabsTrigger value="failed" className="text-xs">خطاهای کارگزاری</TabsTrigger>
              <TabsTrigger value="fast" className="text-xs">تاخیر زیر ۲۰ میلی‌ثانیه</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نماد، کد شلیک یا کارگزاری..."
                className="pr-8 pl-3 py-1.5 h-8 text-xs w-52"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Broker Dropdown */}
            <Select value={brokerFilter} onValueChange={setBrokerFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="همه کارگزاری‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کارگزاری‌ها</SelectItem>
                <SelectItem value="تدبیرپرداز">تدبیرپرداز</SelectItem>
                <SelectItem value="مفید">مفید</SelectItem>
                <SelectItem value="آگاه">آگاه</SelectItem>
                <SelectItem value="فارابیکسو">فارابیکسو</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Dropdown */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="success">فقط موفق</SelectItem>
                <SelectItem value="error">فقط ناموفق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden shadow-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>شناسه (#SN)</TableHead>
                <TableHead>نماد بورسی</TableHead>
                <TableHead>کارگزاری</TableHead>
                <TableHead>زمان شلیک</TableHead>
                <TableHead>تاخیر (ms)</TableHead>
                <TableHead>کد وضعیت</TableHead>
                <TableHead>پیگیری / توضیحات</TableHead>
                <TableHead className="text-center">ریزپکت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedShots.map((shot) => (
                <TableRow key={shot.shotIndex}>
                  <TableCell className="font-mono font-bold text-foreground">#{shot.shotIndex}</TableCell>
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">{shot.symbol || 'فزر'}</TableCell>
                  <TableCell className="text-foreground">{shot.broker || 'تدبیرپرداز'}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {shot.timestamp}
                  </TableCell>
                  <TableCell className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {shot.latencyMs} ms
                  </TableCell>
                  <TableCell>
                    <Badge variant={shot.success ? 'default' : 'destructive'}>
                      {shot.success ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{shot.httpStatus}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground truncate max-w-xs">
                    {shot.trackingCode || shot.errorMessage || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setInspectedShot(shot)}
                      title="مشاهده جزئیات پکت"
                    >
                      <FileCode className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {paginatedShots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    هیچ شلیکی با فیلترهای انتخابی مطابقت ندارد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              نمایش {paginatedShots.length} از {filteredShots.length} مورد
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <span className="px-3 font-mono">
                {currentPage} / {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Packet Inspection Modal using shadcn Dialog */}
      <Dialog open={Boolean(inspectedShot)} onOpenChange={(open) => !open && setInspectedShot(null)}>
        <DialogContent className="max-w-2xl">
          {inspectedShot && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pe-6">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                    <DialogTitle className="text-sm font-bold text-foreground">
                      ریزپکت هگز و وقایع سوکت شلیک #{inspectedShot.shotIndex} ({inspectedShot.symbol || 'فزر'})
                    </DialogTitle>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPacket}
                    className="text-xs gap-1"
                  >
                    {packetCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{packetCopied ? 'کپی شد' : 'کپی'}</span>
                  </Button>
                </div>
              </DialogHeader>

              {/* Request & Response Inspection */}
              <div className="space-y-3 text-xs font-mono mt-2">
                <div>
                  <span className="text-muted-foreground block mb-1 font-sans">
                    هدرهای امنیتی (Sanitized Request Headers):
                  </span>
                  <pre className="p-3 rounded-xl bg-card border border-border text-sky-600 dark:text-sky-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(sanitizeHeadersForDisplay(inspectedShot.headers || {}), null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1 font-sans">بدنه درخواست ارسالی (Request Body):</span>
                  <pre className="p-3 rounded-xl bg-card border border-border text-emerald-600 dark:text-emerald-300 overflow-x-auto text-[11px]">
                    {inspectedShot.rawRequestPayload ||
                      JSON.stringify({ isin: 'IRO1FAZR0001', price: 25000, quantity: 500 }, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1 font-sans">پاسخ دریافتی هسته (Response Payload):</span>
                  <pre className="p-3 rounded-xl bg-card border border-border text-foreground overflow-x-auto text-[11px]">
                    {inspectedShot.rawResponsePayload ||
                      JSON.stringify(
                        {
                          success: inspectedShot.success,
                          trackingCode: inspectedShot.trackingCode,
                          httpStatus: inspectedShot.httpStatus,
                        },
                        null,
                        2
                      )}
                  </pre>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 bg-background/70 backdrop-blur-xl z-10 text-xs text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>صف‌شکن (SafShekan) - آرشیو معاملات و آمار میلی‌ثانیه‌ای</span>
          <span className="font-mono text-[11px]">
            TSE High-Frequency Execution Logs
          </span>
        </div>
      </footer>
    </div>
  );
}
