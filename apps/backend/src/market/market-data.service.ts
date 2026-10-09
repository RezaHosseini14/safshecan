import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SymbolsService, SymbolItem } from './symbols.service.js';
import {
  TsetmcClient,
  RawBestLimitRow,
  RawClientType,
  RawClosingPriceInfo,
  normalizePersian,
} from './tsetmc.client.js';
import { SniperGateway } from '../realtime/sniper.gateway.js';
import {
  ClientFlow,
  LiveQuote,
  MarketDataStatus,
  OrderBookLevel,
} from './market-data.types.js';

const POLL_MS = 3000;
const CACHE_TTL_MS = 1500;
/** Hard ceiling so quote never hangs the HTTP request (UI / proxy timeouts → fake 500). */
const QUOTE_DEADLINE_MS = 6500;

function withDeadline<T>(promise: Promise<T>, ms: number, fallback: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback());
    }, ms);
    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(fallback());
      });
  });
}

@Injectable()
export class MarketDataService implements OnModuleDestroy {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly watchlist = new Set<string>();
  private readonly quoteCache = new Map<string, { quote: LiveQuote; at: number }>();
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastPollAt: string | null = null;
  private lastError: string | null = null;

  constructor(
    private readonly symbolsService: SymbolsService,
    private readonly tsetmc: TsetmcClient,
    private readonly gateway: SniperGateway
  ) {}

  onModuleDestroy() {
    this.stopPolling();
  }

  public getStatus(): MarketDataStatus {
    return {
      watchlist: Array.from(this.watchlist),
      lastPollAt: this.lastPollAt,
      lastError: this.lastError,
      isPolling: this.isPolling,
      cachedQuotes: this.quoteCache.size,
    };
  }

  public watch(symbol: string): { ok: true; watchlist: string[] } {
    try {
      const key = normalizePersian((symbol || '').trim());
      if (key) {
        this.watchlist.add(key);
        this.ensurePolling();
        void this.refreshOne(key).catch((err: unknown) => {
          this.lastError = err instanceof Error ? err.message : String(err);
        });
      }
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : String(err);
    }
    return { ok: true, watchlist: Array.from(this.watchlist) };
  }

  public unwatch(symbol: string): { ok: true; watchlist: string[] } {
    try {
      this.watchlist.delete(normalizePersian((symbol || '').trim()));
      if (this.watchlist.size === 0) this.stopPolling();
    } catch {
      // ignore
    }
    return { ok: true, watchlist: Array.from(this.watchlist) };
  }

  /** Always resolves with a LiveQuote — never throws, never hangs past QUOTE_DEADLINE_MS. */
  public async getQuote(symbol: string, force = false): Promise<LiveQuote> {
    const raw = (symbol || '').trim();
    const key = normalizePersian(raw);

    if (!key) {
      return this.emptyQuote('', 'نماد ارسال نشده است.');
    }

    const cached = this.quoteCache.get(key);
    const liveCached =
      cached?.quote?.source === 'TSETMC' && !cached.quote.degraded ? cached.quote : null;
    const soft =
      liveCached ||
      cached?.quote ||
      this.quoteFromSymbolCache(key, undefined, 'refreshing') ||
      null;

    // Fast path: serve cache and refresh in background (avoids UI hang / proxy 500).
    if (!force && soft) {
      this.watchlist.add(key);
      this.ensurePolling();
      const stale = !cached || Date.now() - cached.at >= CACHE_TTL_MS || soft.source !== 'TSETMC';
      if (stale) {
        void this.refreshOne(key)
          .then((q) => {
            if (q.source === 'TSETMC') this.lastError = null;
          })
          .catch((err: unknown) => {
            this.lastError = err instanceof Error ? err.message : String(err);
          });
      }
      // Live hit — no banner
      if (soft.source === 'TSETMC' && !soft.degraded) return soft;
      // Still trying — soft badge only, no scary alert
      if (!this.lastError) return soft;
      // Confirmed offline after a failed refresh
      return {
        ...soft,
        degraded: true,
        stateTitle: 'کش محلی',
        warning: 'اتصال لحظه‌ای TSETMC برقرار نشد — آخرین داده ذخیره‌شده',
      };
    }

    this.watchlist.add(key);
    this.ensurePolling();

    return withDeadline(this.refreshOne(key), QUOTE_DEADLINE_MS, () => {
      const fallback =
        soft ||
        this.quoteFromSymbolCache(key, undefined, 'timeout') ||
        this.emptyQuote(raw, 'پاسخ TSETMC طول کشید — داده موقت نمایش داده شد');
      return fallback;
    });
  }

  private emptyQuote(symbol: string, warning: string): LiveQuote {
    return {
      ok: false,
      degraded: true,
      warning,
      symbol: symbol || '—',
      name: symbol || '—',
      isin: '',
      insCode: '',
      lastPrice: 0,
      closingPrice: 0,
      yesterdayPrice: 0,
      change: 0,
      changePercent: 0,
      openPrice: 0,
      highPrice: 0,
      lowPrice: 0,
      volume: 0,
      value: 0,
      tradesCount: 0,
      stateTitle: 'بدون داده',
      orderBook: [],
      clientFlow: null,
      fetchedAt: new Date().toISOString(),
      source: 'EMPTY',
    };
  }

  private ensurePolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      void this.pollWatchlist();
    }, POLL_MS);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollWatchlist() {
    if (this.isPolling || this.watchlist.size === 0) return;
    this.isPolling = true;
    try {
      for (const symbol of Array.from(this.watchlist)) {
        try {
          await this.refreshOne(symbol);
        } catch (err: unknown) {
          this.lastError = err instanceof Error ? err.message : String(err);
        }
      }
      this.lastPollAt = new Date().toISOString();
    } finally {
      this.isPolling = false;
    }
  }

  private searchQueriesFor(symbol: string, item?: SymbolItem): string[] {
    const raw = (item?.symbol || symbol).trim();
    // Keep list tiny — each CDN call can take seconds (local + fallback).
    const queries = [raw, item?.isin, normalizePersian(raw)].filter(
      (q): q is string => Boolean(q && q.length >= 2)
    );
    return [...new Set(queries)].slice(0, 2);
  }

  private async resolveInsCode(symbol: string): Promise<{
    symbol: string;
    name: string;
    isin: string;
    insCode: string;
    pMax?: number;
    pMin?: number;
    cached?: SymbolItem;
  } | null> {
    const item = this.symbolsService.getBySymbol(symbol);
    if (item?.insCode) {
      return {
        symbol: item.symbol,
        name: item.name,
        isin: item.isin,
        insCode: String(item.insCode),
        pMax: item.pMax,
        pMin: item.pMin,
        cached: item,
      };
    }

    for (const q of this.searchQueriesFor(symbol, item)) {
      try {
        const hits = await this.tsetmc.searchInstrument(q);
        const normQ = normalizePersian(q);
        const match =
          hits.find((h) => normalizePersian(h.lVal18AFC || '') === normQ) ||
          hits.find((h) =>
            normalizePersian(h.lVal18AFC || '').startsWith(normQ.replace(/[1-4]$/, ''))
          ) ||
          (item?.isin
            ? hits.find((h) => (h.cIsin || '').toUpperCase() === item.isin.toUpperCase())
            : undefined) ||
          hits[0];
        if (match?.insCode) {
          const insCode = String(match.insCode);
          this.symbolsService.patchInsCode(item?.symbol || match.lVal18AFC || symbol, insCode);
          return {
            symbol: match.lVal18AFC || item?.symbol || symbol,
            name: match.lVal30 || item?.name || symbol,
            isin: match.cIsin || item?.isin || '',
            insCode,
            pMax: item?.pMax,
            pMin: item?.pMin,
            cached: item,
          };
        }
      } catch {
        // try next query
      }
    }

    return item
      ? {
          symbol: item.symbol,
          name: item.name,
          isin: item.isin,
          insCode: '',
          pMax: item.pMax,
          pMin: item.pMin,
          cached: item,
        }
      : null;
  }

  private async refreshOne(symbol: string): Promise<LiveQuote> {
    const meta = await this.resolveInsCode(symbol);
    if (!meta) {
      return this.emptyQuote(symbol, `نماد «${symbol}» یافت نشد.`);
    }

    if (!meta.insCode) {
      const fallback = this.quoteFromSymbolCache(meta.symbol, meta.cached);
      if (fallback) return fallback;
      return this.emptyQuote(meta.symbol, 'کد ابزار (insCode) در دسترس نیست.');
    }

    const [infoResult, limitsResult, clientResult] = await Promise.allSettled([
      this.tsetmc.fetchClosingPriceInfo(meta.insCode),
      this.tsetmc.fetchBestLimits(meta.insCode),
      this.tsetmc.fetchClientType(meta.insCode),
    ]);

    const info = infoResult.status === 'fulfilled' ? infoResult.value : null;
    const limits = limitsResult.status === 'fulfilled' ? limitsResult.value : [];
    const clientType = clientResult.status === 'fulfilled' ? clientResult.value : null;

    if (!info) {
      const fallback = this.quoteFromSymbolCache(meta.symbol, meta.cached, 'offline');
      if (fallback) {
        fallback.insCode = meta.insCode;
        fallback.orderBook = this.mapOrderBook(limits || []);
        fallback.clientFlow = this.mapClientFlow(clientType);
        // Keep order book if BestLimits succeeded even when ClosingPriceInfo failed
        if (fallback.orderBook.length > 0) {
          fallback.warning = 'قیمت لحظه‌ای از کش — صف سفارش از TSETMC';
        }
        this.storeAndBroadcast(fallback);
        return fallback;
      }
      const reason =
        infoResult.status === 'rejected'
          ? infoResult.reason instanceof Error
            ? infoResult.reason.message
            : String(infoResult.reason)
          : 'پاسخ خالی از TSETMC';
      return this.emptyQuote(meta.symbol, reason);
    }

    const quote = this.mapClosingInfo(meta, info, limits || [], clientType);
    this.storeAndBroadcast(quote);
    return quote;
  }

  private mapClosingInfo(
    meta: {
      symbol: string;
      name: string;
      isin: string;
      insCode: string;
      pMax?: number;
      pMin?: number;
    },
    info: RawClosingPriceInfo,
    limits: RawBestLimitRow[],
    clientType: RawClientType | null
  ): LiveQuote {
    const lastPrice = Number(info.pDrCotVal || info.pClosing || 0);
    const closingPrice = Number(info.pClosing || 0);
    const yesterdayPrice = Number(info.priceYesterday || 0);
    const change =
      info.priceChange != null
        ? Number(info.priceChange)
        : yesterdayPrice
          ? lastPrice - yesterdayPrice
          : 0;
    const changePercent =
      info.priceChangePercent != null
        ? Number(info.priceChangePercent)
        : yesterdayPrice
          ? (change / yesterdayPrice) * 100
          : 0;

    return {
      ok: true,
      degraded: false,
      symbol: meta.symbol,
      name: meta.name,
      isin: meta.isin,
      insCode: meta.insCode,
      lastPrice,
      closingPrice,
      yesterdayPrice,
      change,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
      openPrice: Number(info.priceFirst || 0),
      highPrice: Number(info.priceMax || 0),
      lowPrice: Number(info.priceMin || 0),
      pMax: meta.pMax,
      pMin: meta.pMin,
      volume: Number(info.qTotTran5J || 0),
      value: Number(info.qTotCap || 0),
      tradesCount: Number(info.zTotTran || 0),
      stateTitle: info.instrumentState?.cEtavalTitle?.trim(),
      underSupervision: info.instrumentState?.underSupervision,
      orderBook: this.mapOrderBook(limits),
      clientFlow: this.mapClientFlow(clientType),
      fetchedAt: new Date().toISOString(),
      source: 'TSETMC',
    };
  }

  private quoteFromSymbolCache(
    symbol: string,
    item?: SymbolItem,
    reason: 'refreshing' | 'timeout' | 'offline' = 'offline'
  ): LiveQuote | null {
    const cached = item || this.symbolsService.getBySymbol(symbol);
    if (!cached) return null;
    const lastPrice = Number(cached.price || cached.closingPrice || 0);
    const yesterdayPrice = Number(cached.yesterdayPrice || 0);
    const change = yesterdayPrice ? lastPrice - yesterdayPrice : 0;
    const changePercent = yesterdayPrice ? (change / yesterdayPrice) * 100 : 0;

    const warning =
      reason === 'refreshing'
        ? undefined
        : reason === 'timeout'
          ? 'پاسخ TSETMC طول کشید — آخرین داده ذخیره‌شده نمایش داده شد'
          : 'اتصال لحظه‌ای TSETMC برقرار نشد — آخرین داده ذخیره‌شده';

    return {
      ok: true,
      degraded: reason !== 'refreshing',
      warning,
      symbol: cached.symbol,
      name: cached.name,
      isin: cached.isin,
      insCode: cached.insCode || '',
      lastPrice,
      closingPrice: Number(cached.closingPrice || lastPrice),
      yesterdayPrice,
      change,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
      openPrice: 0,
      highPrice: Number(cached.highPrice || 0),
      lowPrice: Number(cached.lowPrice || 0),
      pMax: cached.pMax,
      pMin: cached.pMin,
      volume: Number(cached.volume || 0),
      value: Number(cached.value || 0),
      tradesCount: Number(cached.tradesCount || 0),
      stateTitle: reason === 'refreshing' ? 'در حال بروزرسانی…' : 'کش محلی',
      orderBook: [],
      clientFlow: null,
      fetchedAt: new Date().toISOString(),
      source: 'CACHE',
    };
  }

  private storeAndBroadcast(quote: LiveQuote) {
    const cacheKey = normalizePersian(quote.symbol);
    this.quoteCache.set(cacheKey, { quote, at: Date.now() });
    try {
      this.gateway.broadcast({ type: 'QUOTE_UPDATE', data: quote });
    } catch {
      // never break quote path for WS
    }
  }

  private mapOrderBook(rows: RawBestLimitRow[]): OrderBookLevel[] {
    return rows
      .map((r) => ({
        level: Number(r.number || 0),
        bidPrice: Number(r.pMeDem || 0),
        bidVolume: Number(r.qTitMeDem || 0),
        bidOrders: Number(r.zOrdMeDem || 0),
        askPrice: Number(r.pMeOf || 0),
        askVolume: Number(r.qTitMeOf || 0),
        askOrders: Number(r.zOrdMeOf || 0),
      }))
      .sort((a, b) => a.level - b.level);
  }

  private mapClientFlow(raw: RawClientType | null): ClientFlow | null {
    if (!raw) return null;
    return {
      buyIndividualVolume: Number(raw.buy_I_Volume || 0),
      buyLegalVolume: Number(raw.buy_N_Volume || 0),
      buyIndividualCount: Number(raw.buy_I_Count || 0),
      buyLegalCount: Number(raw.buy_N_Count || 0),
      sellIndividualVolume: Number(raw.sell_I_Volume || 0),
      sellLegalVolume: Number(raw.sell_N_Volume || 0),
      sellIndividualCount: Number(raw.sell_I_Count || 0),
      sellLegalCount: Number(raw.sell_N_Count || 0),
    };
  }
}
