import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsetmcClient, RawMarketWatchItem, DetectedIPO, normalizePersian } from './tsetmc.client.js';

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
  private tsetmcClient: TsetmcClient;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;

  constructor() {
    this.tsetmcClient = new TsetmcClient();
    this.loadInitialData();
  }

  public onModuleInit() {
    // Proactively start a background sync on startup without blocking Nest initialization
    setTimeout(() => {
      this.syncFromTsetmc().catch((err) => {
        this.logger.warn(`خطا در همگام‌سازی اولیه با TSETMC: ${err.message}`);
      });
    }, 1000);

    // Schedule regular sync every 5 minutes
    this.syncTimer = setInterval(() => {
      this.syncFromTsetmc().catch((err) => {
        this.logger.warn(`خطا در دوره‌ی همگام‌سازی TSETMC: ${err.message}`);
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
   * Find data file path across possible directory layouts (src, dist, root)
   */
  private resolveDataPath(filename: string): string | null {
    const potentialPaths = [
      path.resolve(__dirname, `../data/${filename}`),
      path.resolve(__dirname, `../../src/data/${filename}`),
      path.resolve(process.cwd(), `src/data/${filename}`),
      path.resolve(process.cwd(), `dist/data/${filename}`),
      path.resolve(process.cwd(), `apps/api/src/data/${filename}`),
    ];
    return potentialPaths.find((p) => fs.existsSync(p)) || null;
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
                title: `عرضه اولیه ${item.name || item.symbol}`,
                description: item.description || `عرضه اولیه مورخ ${item.listingDate || ''}`,
                dateStr: item.listingDate,
                status: 'RECENT',
                source: 'HISTORICAL_DATABASE',
                announcedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (err: any) {
        this.logger.error(`خطا در بارگذاری historical-ipos.json: ${err.message}`);
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
          this.logger.log(`✓ تعداد ${this.symbolsMap.size} نماد اولیه از دیتابیس محلی بارگذاری شد.`);
          return;
        }
      } catch (err: any) {
        this.logger.error(`خطا در بارگذاری symbols.json: ${err.message}`);
      }
    }
  }

  /**
   * Translates flow code into Persian market title
   */
  private getMarketTitle(flow: number): string {
    switch (flow) {
      case 1:
        return 'بورس';
      case 2:
        return 'فرابورس';
      case 3:
        return 'پایه فرابورس';
      case 4:
        return 'بورس کالا';
      case 5:
        return 'بورس انرژی';
      case 7:
        return 'مشتقه / آتی';
      default:
        return 'بورس';
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
        message: 'همگام‌سازی در حال حاضر در حال اجرا است.',
      };
    }

    this.isSyncing = true;
    this.lastError = null;
    const newlyDetectedIpos: string[] = [];

    try {
      this.logger.log('در حال دریافت اطلاعات دیده‌بان بازار و پیام‌های ناظر از TSETMC...');

      // 1. Fetch live supervisor messages for Bourse and Farabourse
      let msgsFlow1: any[] = [];
      let msgsFlow2: any[] = [];
      try {
        [msgsFlow1, msgsFlow2] = await Promise.all([
          this.tsetmcClient.fetchSupervisorMessages(1, 100),
          this.tsetmcClient.fetchSupervisorMessages(2, 100),
        ]);
      } catch (msgErr: any) {
        this.logger.warn(`دریافت پیام‌های ناظر با خطا مواجه شد: ${msgErr.message}`);
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
          this.logger.log(`✓ تعداد ${detected.length} اطلاعیه عرضه اولیه و پذیره‌نویسی از پیام‌های ناظر استخراج شد.`);
        }
      }

      // 2. Fetch live Market Watch
      const rawWatch = await this.tsetmcClient.fetchMarketWatch();
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
        this.logger.log(`✓ دیده‌بان بازار بروزرسانی شد: ${rawWatch.length} نماد پردازش شدند.`);
      }

      // Ensure all detected IPOs are in the symbols map even if not currently trading in MarketWatch
      for (const [sym, details] of this.iposMap.entries()) {
        if (!this.symbolsMap.has(sym)) {
          this.symbolsMap.set(sym, {
            symbol: sym,
            name: details.title || `عرضه اولیه ${sym}`,
            isin: '',
            market: 'فرابورس / بورس',
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
        message: `همگام‌سازی موفقیت‌آمیز: ${this.symbolsMap.size} نماد و ${this.getIpos().length} عرضه اولیه بروزرسانی شد.`,
      };
    } catch (err: any) {
      this.lastError = err.message;
      this.logger.error(`خطا در همگام‌سازی زنده با TSETMC: ${err.message}`);
      return {
        success: false,
        totalSymbols: this.symbolsMap.size,
        ipoCount: this.getIpos().length,
        newIpos: [],
        message: `خطا در برقراری ارتباط با بورس: ${err.message}`,
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
      const symbolsPath = this.resolveDataPath('symbols.json');
      if (symbolsPath) {
        const array = Array.from(this.symbolsMap.values());
        fs.writeFile(symbolsPath, JSON.stringify(array, null, 2), 'utf8', (err) => {
          if (err) this.logger.warn(`ذخیره فایل نمادها روی دیسک با خطا مواجه شد: ${err.message}`);
        });
      }
    } catch {
      // ignore disk write errors
    }
  }

  /**
   * Search and filter symbols with rich criteria
   */
  public search(query?: string, onlyIpo?: boolean, market?: string): SymbolItem[] {
    let list = Array.from(this.symbolsMap.values());

    // 1. Filter by IPO
    if (onlyIpo) {
      list = list.filter((s) => s.isIpo);
    }

    // 2. Filter by Market
    if (market && market.trim()) {
      const cleanMarket = market.trim();
      list = list.filter((s) => s.market && s.market.includes(cleanMarket));
    }

    // 3. Filter by Query
    if (query && query.trim()) {
      const clean = normalizePersian(query).toLowerCase();
      list = list.filter(
        (s) =>
          normalizePersian(s.symbol).toLowerCase().includes(clean) ||
          normalizePersian(s.name).toLowerCase().includes(clean) ||
          (s.isin && s.isin.toLowerCase().includes(clean)) ||
          (s.group && normalizePersian(s.group).toLowerCase().includes(clean)) ||
          (s.ipoDetails && normalizePersian(s.ipoDetails.title).toLowerCase().includes(clean))
      );
    }

    // 4. Sort: IPOs and exact matches first
    return list.sort((a, b) => {
      // Prioritize active IPOs
      if (a.isIpo && !b.isIpo) return -1;
      if (!a.isIpo && b.isIpo) return 1;

      // Exact match prioritisation
      if (query) {
        const clean = query.trim().toLowerCase();
        if (a.symbol.toLowerCase() === clean && b.symbol.toLowerCase() !== clean) return -1;
        if (b.symbol.toLowerCase() === clean && a.symbol.toLowerCase() !== clean) return 1;
      }

      // Sort by volume/trades if available
      const valA = a.value || 0;
      const valB = b.value || 0;
      return valB - valA;
    });
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
}
