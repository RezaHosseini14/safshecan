import https from 'node:https';
import http from 'node:http';
import os from 'node:os';
import { Logger } from '@nestjs/common';

export interface RawMarketWatchItem {
  lva: string; // Symbol ticker (e.g., 'فزر')
  lvc: string; // Company name (e.g., 'پویا زرکان آق دره')
  insID: string; // ISIN code (e.g., 'IRO3PZAZ0001')
  insCode: string; // TSETMC instrument code
  flow: number; // 1: Bourse, 2: Farabourse, 3: Payeh, 4: Kala, etc.
  pMax?: number; // Price ceiling (سقف قیمت مجاز)
  pMin?: number; // Price floor (کف قیمت مجاز)
  pcl?: number; // Closing price (قیمت پایانی)
  pdv?: number; // Last trade price (آخرین معامله)
  py?: number; // Yesterday price (قیمت دیروز)
  pmx?: number; // Today high
  pmn?: number; // Today low
  bv?: number; // Base volume (حجم مبنا)
  qtj?: number; // Total volume
  ztt?: number; // Total trades count
  qtc?: number; // Total value
  eps?: number;
  pe?: string | number | null;
  csv?: string;
  cGrValCot?: string;
}

export interface RawSupervisorMsg {
  tseMsgIdn?: number;
  dEven?: number; // Date e.g. 20261006
  hEven?: number; // Time e.g. 100015
  tseTitle?: string;
  tseDesc?: string;
  flow?: number;
}

export interface DetectedIPO {
  symbol: string;
  companyName?: string;
  title: string;
  description: string;
  dateStr?: string;
  timeStr?: string;
  status: 'UPCOMING' | 'ACTIVE_TODAY' | 'RECENT';
  source: 'SUPERVISOR_MSG' | 'HISTORICAL_DATABASE';
  announcedAt: string;
}

export function normalizePersian(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

export class TsetmcClient {
  private readonly logger = new Logger(TsetmcClient.name);
  private preferredLocalAddress: string | null = null;

  constructor() {
    this.detectLocalAddress();
  }

  /**
   * Detects the non-VPN domestic IPv4 network interface (e.g. Wi-Fi, Ethernet)
   * to ensure requests to TSETMC reach domestic Iranian servers even when a VPN tunnel is active.
   */
  private detectLocalAddress(): void {
    try {
      const ifaces = os.networkInterfaces();
      // Search for physical interfaces first
      for (const [name, addrs] of Object.entries(ifaces)) {
        if (!addrs) continue;
        const lower = name.toLowerCase();
        // Skip tunnel/virtual interfaces
        if (
          lower.includes('tun') ||
          lower.includes('tap') ||
          lower.includes('singbox') ||
          lower.includes('clash') ||
          lower.includes('v2ray') ||
          lower.includes('wsl')
        ) {
          continue;
        }

        for (const a of addrs) {
          if (a.family === 'IPv4' && !a.internal && a.address) {
            this.preferredLocalAddress = a.address;
            this.logger.debug(`اینترفیس شبکه محلی شناسایی شد: ${name} (${a.address})`);
            return;
          }
        }
      }
    } catch {
      this.preferredLocalAddress = null;
    }
  }

  /**
   * Resilient HTTP GET request with fallback between direct connection and binding to local physical adapter.
   */
  private async getJson<T>(urlStr: string, timeoutMs = 12000): Promise<T> {
    const url = new URL(urlStr);

    const makeAttempt = (localAddr: string | null): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        const options: https.RequestOptions = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          rejectUnauthorized: false,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8',
            Referer: 'https://tsetmc.com/',
          },
        };

        if (localAddr) {
          options.localAddress = localAddr;
        }

        const req = client.request(options, (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            res.resume();
            return reject(new Error(`HTTP status ${res.statusCode} from ${url.pathname}`));
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data) as T;
              resolve(parsed);
            } catch (err: any) {
              reject(new Error(`JSON parse error from ${url.pathname}: ${err.message}`));
            }
          });
        });

        req.setTimeout(timeoutMs, () => {
          req.destroy(new Error(`Timeout after ${timeoutMs}ms for ${url.pathname}`));
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.end();
      });
    };

    // Attempt 1: Using detected domestic interface (if available) to bypass VPN routing
    if (this.preferredLocalAddress) {
      try {
        return await makeAttempt(this.preferredLocalAddress);
      } catch (err: any) {
        this.logger.debug(`تلاش با آدرس محلی ${this.preferredLocalAddress} ناموفق بود: ${err.message}. تلاش با پیش‌فرض سیستم...`);
      }
    }

    // Attempt 2: Standard system routing fallback
    return await makeAttempt(null);
  }

  /**
   * Fetches the comprehensive live Market Watch containing all ~3,300+ symbols.
   */
  public async fetchMarketWatch(): Promise<RawMarketWatchItem[]> {
    const url = 'https://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0';
    const json = await this.getJson<{ marketwatch?: RawMarketWatchItem[] }>(url, 15000);
    return json?.marketwatch || [];
  }

  /**
   * Fetches official supervisor messages (پیام‌های ناظر بازار) for a given market flow.
   * flow 1: Bourse, flow 2: Farabourse
   */
  public async fetchSupervisorMessages(flow: number, top = 100): Promise<RawSupervisorMsg[]> {
    const url = `https://cdn.tsetmc.com/api/Msg/GetMsgByFlow/${flow}/${top}`;
    const json = await this.getJson<{ msg?: RawSupervisorMsg[] }>(url, 10000);
    return json?.msg || [];
  }

  /**
   * Parses supervisor messages and historical references to extract active and upcoming IPOs.
   */
  public extractIposFromMessages(messages: RawSupervisorMsg[]): DetectedIPO[] {
    const ipos: DetectedIPO[] = [];
    const seenSymbols = new Set<string>();

    const ipoKeywords = ['عرضه اوليه', 'عرضه اولیه', 'پذیره‌نویسی', 'پذیره نویسی', 'حراج اولیه', 'سفارش‌گیری نماد', 'سفارش گیری نماد'];

    for (const msg of messages) {
      const title = (msg.tseTitle || '').trim();
      const desc = (msg.tseDesc || '').trim();
      const combined = `${title} ${desc}`;

      // Skip debt/treasury bill auctions
      if (
        combined.includes('اوراق مالی اسلامی') ||
        combined.includes('اوراق مالي اسلامي') ||
        combined.includes('مظنه‌گیری') ||
        combined.includes('مظنه‌گيري')
      ) {
        continue;
      }

      const isIpoRelated = ipoKeywords.some((kw) => combined.includes(kw));
      if (!isIpoRelated) continue;

      // Extract symbol name using various Persian regulatory patterns
      // 1. (نماد) in parentheses
      let matchedSymbol: string | null = null;
      const parenMatch = combined.match(/[\(（]([\u0600-\u06FF0-9\s]{2,15})[\)）]/);
      if (parenMatch) {
        matchedSymbol = parenMatch[1].trim();
      }

      // 2. نماد معاملاتی X or نماد X
      if (!matchedSymbol) {
        const symbolPhraseMatch = combined.match(/نماد(?:\s+معاملاتی)?\s+([\u0600-\u06FF0-9]+)/);
        if (symbolPhraseMatch) {
          matchedSymbol = symbolPhraseMatch[1].trim();
        }
      }

      if (!matchedSymbol || matchedSymbol.length < 2 || matchedSymbol.includes('عام') || matchedSymbol.includes('سهام')) {
        continue;
      }

      // Clean symbol (remove trailing numbers if it's like "فپردیس1" vs "فپردیس")
      const rawSymbol = normalizePersian(matchedSymbol);
      const baseSymbol = rawSymbol.replace(/[1-4]$/, '');

      if (seenSymbols.has(rawSymbol) || seenSymbols.has(baseSymbol)) {
        continue;
      }
      seenSymbols.add(rawSymbol);

      // Determine date
      let dateStr = '';
      if (msg.dEven) {
        const d = String(msg.dEven);
        if (d.length === 8) {
          dateStr = `${d.substring(0, 4)}/${d.substring(4, 6)}/${d.substring(6, 8)}`;
        }
      }
      // Or search for Persian date in text e.g. 1405/07/15
      const dateInTextMatch = combined.match(/(140\d\/[01]\d\/[0-3]\d)/);
      if (dateInTextMatch) {
        dateStr = dateInTextMatch[1];
      }

      // Check status
      let status: 'UPCOMING' | 'ACTIVE_TODAY' | 'RECENT' = 'RECENT';
      const now = new Date();
      const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      if (String(msg.dEven) === todayStr || combined.includes('امروز')) {
        status = 'ACTIVE_TODAY';
      } else if (combined.includes('روز چهار') || combined.includes('روز دو') || combined.includes('روز سه') || combined.includes('آینده')) {
        status = 'UPCOMING';
      }

      // Extract company name
      let companyName = '';
      const compMatch = combined.match(/شرکت\s+([\u0600-\u06FF\s]+?)(?:\s+در\s+نماد|\s+با\s+نماد|\s*[\(（]|\s+به\s+روش)/);
      if (compMatch) {
        companyName = compMatch[1].trim();
      }

      ipos.push({
        symbol: rawSymbol,
        companyName: companyName || undefined,
        title,
        description: desc.length > 250 ? `${desc.substring(0, 250)}...` : desc,
        dateStr,
        status,
        source: 'SUPERVISOR_MSG',
        announcedAt: new Date().toISOString(),
      });
    }

    return ipos;
  }
}
