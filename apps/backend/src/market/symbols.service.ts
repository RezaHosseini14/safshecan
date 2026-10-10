import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsetmcClient, normalizePersian } from './tsetmc.client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface IpoDetails {
  title: string;
  description: string;
  dateStr?: string;
  timeStr?: string;
  stage?: string;
  status: 'UPCOMING' | 'ACTIVE_TODAY' | 'RECENT';
  source: 'SUPERVISOR_MSG' | 'HISTORICAL_DATABASE';
  announcedAt: string;
}

export interface SymbolItem {
  symbol: string;
  name: string;
  isin: string;
  /** TSETMC instrument code — required for per-symbol live APIs */
  insCode?: string;
  group?: string;
  market?: string;
  basePrice?: number;
  price?: number;
  closingPrice?: number;
  yesterdayPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  pMax?: number; // سقف قیمت مجاز امروز
  pMin?: number; // کف قیمت مجاز امروز
  baseVolume?: number;
  volume?: number;
  tradesCount?: number;
  value?: number;
  eps?: number;
  pe?: string | number | null;
  isIpo?: boolean;
  ipoDetails?: IpoDetails;
  lastUpdated?: string;
}

function briefSymbol(item: SymbolItem): SymbolItem {
  return {
    symbol: item.symbol,
    name: item.name,
    isin: item.isin,
    insCode: item.insCode,
    group: item.group,
    market: item.market,
  };
}

export interface SyncStatus {
  totalSymbols: number;
  ipoCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
  lastError: string | null;
}

@Injectable()
export class SymbolsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SymbolsService.name);
  private symbolsMap = new Map<string, SymbolItem>();
  private iposMap = new Map<string, IpoDetails>();
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;

  constructor(private readonly tsetmcClient: TsetmcClient) {
    this.loadInitialData();
  }

  public onModuleInit() {
    // Proactively start a background sync on startup without blocking Nest initialization
    setTimeout(() => {
      this.syncFromTsetmc().catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(t('logs', 'symbolBootFail', { detail }));
      });
    }, 1000);

    // Schedule regular sync every 5 minutes
    this.syncTimer = setInterval(() => {
      this.syncFromTsetmc().catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(t('logs', 'symbolLoopFail', { detail }));
      });
    }, 5 * 60 * 1000);
  }

  public onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Find data file path across possible directory layouts (src, dist, root).
   * Prefer src/data (canonical) over dist/data so runtime cache writes do not
   * thrash a watched dist tree during `pnpm dev`.
   */
  private resolveDataPath(filename: string): string | null {
    const potentialPaths = [
      path.resolve(__dirname, `../../data/${filename}`),
      path.resolve(process.cwd(), `data/${filename}`),
      path.resolve(process.cwd(), `apps/backend/data/${filename}`),
    ];
    return potentialPaths.find((p) => fs.existsSync(p)) || null;
  }

  /** Stable path for persisting cache outside src so the compiler watch does not restart. */
  private resolvePersistPath(filename: string): string | null {
    const preferred = [
      path.resolve(__dirname, `../../data/${filename}`),
      path.resolve(process.cwd(), `data/${filename}`),
      path.resolve(process.cwd(), `apps/backend/data/${filename}`),
    ];
    for (const p of preferred) {
      if (fs.existsSync(path.dirname(p))) return p;
    }
    return this.resolveDataPath(filename);
  }

  /**
   * Load seed symbols and historical IPOs from disk immediately
   */
  private loadInitialData(): void {
    // 1. Load historical IPOs
    const iposPath = this.resolveDataPath('historical-ipos.json');
    if (iposPath) {
      try {
        const raw = fs.readFileSync(iposPath, 'utf8');
        const historical = JSON.parse(raw);
        if (Array.isArray(historical)) {
          for (const item of historical) {
            if (item.symbol) {
              this.iposMap.set(item.symbol.trim(), {
                title: t('dossier', 'ipoTitle', { name: item.name || item.symbol }),
                description: item.description || t('dossier', 'ipoDescription', { date: item.listingDate || '' }),
                dateStr: item.listingDate,
                status: 'RECENT',
                source: 'HISTORICAL_DATABASE',
                announcedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (err: any) {
        this.logger.error(t('logs', 'historicalFail', { detail: err.message }));
      }
    }

    // 2. Load cached symbols
    const symbolsPath = this.resolveDataPath('symbols.json');
    if (symbolsPath) {
      try {
        const raw = fs.readFileSync(symbolsPath, 'utf8');
        const list: SymbolItem[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            const sym = item.symbol.trim();
            const isIpo = item.isIpo || this.iposMap.has(sym);
            this.symbolsMap.set(sym, {
              ...item,
              symbol: sym,
              isIpo,
              ipoDetails: isIpo ? (this.iposMap.get(sym) || item.ipoDetails) : undefined,
            });
          }
          this.logger.log(t('logs', 'symbolsLoaded', { count: this.symbolsMap.size }));
          return;
        }
      } catch (err: any) {
        this.logger.error(t('logs', 'symbolsFileFail', { detail: err.message }));
      }
    }
  }

  /**
   * Translates flow code into Persian market title
   */
  private getMarketTitle(flow: number): string {
    switch (flow) {
      case 1:
        return t('dossier', 'market.bourse');
      case 2:
        return t('dossier', 'market.farabourse');
      case 3:
        return t('dossier', 'market.base');
      case 4:
        return t('dossier', 'market.commodity');
      case 5:
        return t('dossier', 'market.energy');
      case 7:
        return t('dossier', 'market.derivative');
      default:
        return t('dossier', 'market.bourse');
    }
  }

  /**
   * Syncs real-time market watch and IPO supervisory announcements from TSETMC
   */
  public async syncFromTsetmc(): Promise<{
    success: boolean;
    totalSymbols: number;
    ipoCount: number;
    newIpos: string[];
    message: string;
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        totalSymbols: this.symbolsMap.size,
        ipoCount: this.getIpos().length,
        newIpos: [],
        message: t('errors', 'syncBusy'),
      };
    }

    this.isSyncing = true;
    this.lastError = null;
    const newlyDetectedIpos: string[] = [];

    try {
      this.logger.log(t('logs', 'supervisorFetch'));

      // 1. Fetch live supervisor messages for Bourse and Farabourse (hard deadline)
      let msgsFlow1: any[] = [];
      let msgsFlow2: any[] = [];
      try {
        [msgsFlow1, msgsFlow2] = await Promise.race([
          Promise.all([
            this.tsetmcClient.fetchSupervisorMessages(1, 100),
            this.tsetmcClient.fetchSupervisorMessages(2, 100),
          ]),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(t('errors', 'supervisorTimeout'))), 10000)
          ),
        ]);
      } catch (msgErr: unknown) {
        const msg = msgErr instanceof Error ? msgErr.message : String(msgErr);
        this.logger.warn(t('logs', 'supervisorFail', { detail: msg }));
      }

      const allMsgs = [...msgsFlow1, ...msgsFlow2];
      if (allMsgs.length > 0) {
        const detected = this.tsetmcClient.extractIposFromMessages(allMsgs);
        for (const ipo of detected) {
          const sym = ipo.symbol.trim();
          const cleanSym = sym.replace(/[1-4]$/, '');

          if (!this.iposMap.has(sym) && !this.iposMap.has(cleanSym)) {
            newlyDetectedIpos.push(sym);
          }

          const ipoDetails: IpoDetails = {
            title: ipo.title,
            description: ipo.description,
            dateStr: ipo.dateStr,
            timeStr: ipo.timeStr,
            status: ipo.status,
            source: 'SUPERVISOR_MSG',
            announcedAt: ipo.announcedAt,
          };

          this.iposMap.set(sym, ipoDetails);
          this.iposMap.set(cleanSym, ipoDetails);

          // If symbol exists in map, mark it
          if (this.symbolsMap.has(sym)) {
            const current = this.symbolsMap.get(sym)!;
            current.isIpo = true;
            current.ipoDetails = ipoDetails;
          }
          if (this.symbolsMap.has(cleanSym)) {
            const current = this.symbolsMap.get(cleanSym)!;
            current.isIpo = true;
            current.ipoDetails = ipoDetails;
          }
        }
        if (detected.length > 0) {
          this.logger.log(t('logs', 'ipoExtracted', { count: detected.length }));
        }
      }

      // 2. Fetch live Market Watch (hard deadline — CDN hang must not kill HTTP)
      let rawWatch: Awaited<ReturnType<TsetmcClient['fetchMarketWatch']>> = [];
      try {
        rawWatch = await Promise.race([
          this.tsetmcClient.fetchMarketWatch(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(t('errors', 'watchTimeout'))), 15000)
          ),
        ]);
      } catch (watchErr: unknown) {
        const msg = watchErr instanceof Error ? watchErr.message : String(watchErr);
        this.lastError = msg;
        this.logger.warn(t('logs', 'watchFail', { detail: msg }));
        return {
          success: false,
          totalSymbols: this.symbolsMap.size,
          ipoCount: this.getIpos().length,
          newIpos: newlyDetectedIpos,
          message: t('errors', 'tsetmcDown', { count: this.symbolsMap.size }),
        };
      }
      if (Array.isArray(rawWatch) && rawWatch.length > 0) {
        for (const item of rawWatch) {
          if (!item.lva) continue;
          const sym = item.lva.trim();
          const cleanSym = sym.replace(/[1-4]$/, '');

          const isIpo = this.iposMap.has(sym) || this.iposMap.has(cleanSym);
          const ipoDetails = isIpo ? (this.iposMap.get(sym) || this.iposMap.get(cleanSym)) : undefined;

          const existing = this.symbolsMap.get(sym) || this.symbolsMap.get(cleanSym);

          const updated: SymbolItem = {
            symbol: sym,
            name: item.lvc ? item.lvc.trim() : (existing?.name || sym),
            isin: item.insID || existing?.isin || '',
            insCode: item.insCode ? String(item.insCode) : existing?.insCode,
            market: this.getMarketTitle(item.flow),
            group: existing?.group,
            price: item.pdv || item.pcl || existing?.price,
            closingPrice: item.pcl,
            yesterdayPrice: item.py,
            pMax: item.pMax,
            pMin: item.pMin,
            highPrice: item.pmx || item.pMax,
            lowPrice: item.pmn || item.pMin,
            baseVolume: item.bv,
            volume: item.qtj,
            tradesCount: item.ztt,
            value: item.qtc,
            eps: item.eps,
            pe: item.pe,
            isIpo: isIpo || existing?.isIpo || false,
            ipoDetails: ipoDetails || existing?.ipoDetails,
            lastUpdated: new Date().toLocaleTimeString('fa-IR'),
          };

          this.symbolsMap.set(sym, updated);
        }
        this.logger.log(t('logs', 'watchUpdated', { count: rawWatch.length }));
      }

      // Ensure all detected IPOs are in the symbols map even if not currently trading in MarketWatch
      for (const [sym, details] of this.iposMap.entries()) {
        if (!this.symbolsMap.has(sym)) {
          this.symbolsMap.set(sym, {
            symbol: sym,
            name: details.title || t('dossier', 'ipoTitle', { name: sym }),
            isin: '',
            market: t('dossier', 'market.mixed'),
            isIpo: true,
            ipoDetails: details,
            lastUpdated: new Date().toLocaleTimeString('fa-IR'),
          });
        }
      }

      this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');

      // 3. Save cache to disk in background
      this.persistCacheToDisk();

      return {
        success: true,
        totalSymbols: this.symbolsMap.size,
        ipoCount: this.getIpos().length,
        newIpos: newlyDetectedIpos,
        message: t('errors', 'syncOk', { symbols: this.symbolsMap.size, ipos: this.getIpos().length }),
      };
    } catch (err: any) {
      this.lastError = err.message;
      this.logger.error(t('logs', 'liveSyncFail', { detail: err.message }));
      return {
        success: false,
        totalSymbols: this.symbolsMap.size,
        ipoCount: this.getIpos().length,
        newIpos: [],
        message: t('errors', 'bourseDown', { detail: err.message }),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Asynchronously saves current symbols cache to symbols.json
   */
  private persistCacheToDisk(): void {
    try {
      const symbolsPath = this.resolvePersistPath('symbols.json');
      if (symbolsPath) {
        const array = Array.from(this.symbolsMap.values());
        fs.writeFile(symbolsPath, JSON.stringify(array, null, 2), 'utf8', (err) => {
          if (err) this.logger.warn(t('logs', 'symbolDiskFail', { detail: err.message }));
        });
      }
    } catch {
      // ignore disk write errors
    }
  }

  /**
   * Search and filter symbols. Callers pass a small limit; the symbol picker
   * asks for the full catalog and virtualizes it.
   */
  public search(
    query?: string,
    onlyIpo?: boolean,
    market?: string,
    limit = 150,
    brief = false
  ): SymbolItem[] {
    try {
      let list = Array.from(this.symbolsMap.values());

      if (onlyIpo) {
        list = list.filter((s) => s.isIpo);
      }

      if (market && market.trim()) {
        const cleanMarket = market.trim();
        list = list.filter((s) => s.market && s.market.includes(cleanMarket));
      }

      if (query && query.trim()) {
        const clean = normalizePersian(query).toLowerCase();
        list = list.filter(
          (s) =>
            normalizePersian(s.symbol).toLowerCase().includes(clean) ||
            normalizePersian(s.name).toLowerCase().includes(clean) ||
            (s.isin && s.isin.toLowerCase().includes(clean)) ||
            (s.group && normalizePersian(s.group).toLowerCase().includes(clean)) ||
            (s.ipoDetails &&
              normalizePersian(s.ipoDetails.title).toLowerCase().includes(clean))
        );
      }

      list.sort((a, b) => {
        if (a.isIpo && !b.isIpo) return -1;
        if (!a.isIpo && b.isIpo) return 1;

        if (query) {
          const clean = normalizePersian(query).toLowerCase();
          const aExact = normalizePersian(a.symbol).toLowerCase() === clean;
          const bExact = normalizePersian(b.symbol).toLowerCase() === clean;
          if (aExact && !bExact) return -1;
          if (bExact && !aExact) return 1;
        }

        return (b.value || 0) - (a.value || 0);
      });

      const cap = Math.min(Math.max(Number(limit) || 150, 1), 10_000);
      const page = list.slice(0, cap);
      return brief ? page.map(briefSymbol) : page;
    } catch (err: unknown) {
      this.logger.error(
        `search failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return [];
    }
  }

  /**
   * Returns all active and recent IPOs
   */
  public getIpos(): SymbolItem[] {
    return Array.from(this.symbolsMap.values())
      .filter((s) => s.isIpo)
      .sort((a, b) => {
        // Today's active IPOs first
        if (a.ipoDetails?.status === 'ACTIVE_TODAY') return -1;
        if (b.ipoDetails?.status === 'ACTIVE_TODAY') return 1;
        if (a.ipoDetails?.status === 'UPCOMING') return -1;
        if (b.ipoDetails?.status === 'UPCOMING') return 1;
        return 0;
      });
  }

  /**
   * Returns current sync and data status
   */
  public getStatus(): SyncStatus {
    return {
      totalSymbols: this.symbolsMap.size,
      ipoCount: this.getIpos().length,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing,
      lastError: this.lastError,
    };
  }

  /** Exact or normalized ticker lookup (keeps trailing board digit variants). */
  public getBySymbol(symbol: string): SymbolItem | undefined {
    if (!symbol?.trim()) return undefined;
    const raw = symbol.trim();
    const clean = raw.replace(/[1-4]$/, '');
    return (
      this.symbolsMap.get(raw) ||
      this.symbolsMap.get(normalizePersian(raw)) ||
      this.symbolsMap.get(clean) ||
      this.symbolsMap.get(normalizePersian(clean)) ||
      Array.from(this.symbolsMap.values()).find(
        (s) =>
          normalizePersian(s.symbol) === normalizePersian(raw) ||
          normalizePersian(s.symbol.replace(/[1-4]$/, '')) === normalizePersian(clean)
      )
    );
  }

  public getTsetmcClient(): TsetmcClient {
    return this.tsetmcClient;
  }

  /** Persist discovered insCode onto a cached symbol (and clean variant). */
  public patchInsCode(symbol: string, insCode: string): void {
    if (!symbol?.trim() || !insCode) return;
    const item = this.getBySymbol(symbol);
    if (!item) return;
    item.insCode = String(insCode);
    this.symbolsMap.set(item.symbol, item);
    const clean = item.symbol.replace(/[1-4]$/, '');
    if (clean !== item.symbol && this.symbolsMap.has(clean)) {
      this.symbolsMap.get(clean)!.insCode = String(insCode);
    }
  }
}
