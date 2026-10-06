import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NetworkConfig, AccountInfo, OrderConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ParsedBrokerInfo {
  id: 'tadbir' | 'easytrader' | 'rayan' | 'farabi' | 'sahra' | 'custom';
  name: string;
}

export interface AdvancedCurlParseResult {
  network: NetworkConfig;
  broker: ParsedBrokerInfo;
  account: AccountInfo;
  extractedOrder: {
    symbol?: string;
    price?: number;
    quantity?: number;
    isin?: string;
    side?: 'BUY' | 'SELL';
  };
}

export class CurlParser {
  private static symbolsMap: Map<string, { symbol: string; name: string }> | null = null;

  private static loadSymbolsMap(): Map<string, { symbol: string; name: string }> {
    if (this.symbolsMap) return this.symbolsMap;
    this.symbolsMap = new Map();
    try {
      const dataPath = path.resolve(__dirname, '../data/symbols.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const list = JSON.parse(raw);
        list.forEach((item: any) => {
          if (item.isin) {
            this.symbolsMap!.set(item.isin.toUpperCase(), { symbol: item.symbol, name: item.name });
          }
        });
      }
    } catch {}
    return this.symbolsMap;
  }

  /**
   * تجزیه هوشمند و پیشرفته دستور cURL با استخراج توکن، کوکی، نوع کارگزاری و اطلاعات کاربر
   */
  public static parseAdvanced(curlCommand: string): AdvancedCurlParseResult {
    const network = this.parse(curlCommand);
    const broker = this.detectBroker(network.targetUrl, network.headers);
    const account = this.extractAccountInfo(network.headers, network.bodyTemplate, broker.name);
    const extractedOrder = this.extractOrderData(network.bodyTemplate);

    return {
      network,
      broker,
      account,
      extractedOrder,
    };
  }

  /**
   * تجزیه یک دستور cURL کپی شده از مرورگر (Chrome/Edge/Firefox) و استخراج URL، هدرها و بدنه
   */
  public static parse(curlCommand: string): NetworkConfig {
    if (!curlCommand || typeof curlCommand !== 'string') {
      throw new Error('دستور cURL خالی است.');
    }

    const cleanCommand = curlCommand.replace(/\\\r?\n/g, ' ').trim();
    let url = '';
    let method: 'GET' | 'POST' | 'PUT' = 'POST';
    const headers: Record<string, string> = {};
    let body = '';
    let cookies = '';

    // ۱. استخراج URL
    const urlMatches = cleanCommand.match(/curl\s+(?:'([^']+)'|"([^"]+)"|(\S+))/i);
    if (urlMatches) {
      url = urlMatches[1] || urlMatches[2] || urlMatches[3] || '';
    }

    if (!url || url.startsWith('-')) {
      const explicitUrlMatch = cleanCommand.match(/(?:--url\s+['"]?([^'"\s]+)['"]?)|(?:https?:\/\/[^\s'"]+)/i);
      if (explicitUrlMatch) {
        url = explicitUrlMatch[1] || explicitUrlMatch[0];
      }
    }

    // ۲. استخراج Method
    const methodMatch = cleanCommand.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase() as any;
    }

    // ۳. استخراج Headers
    const headerRegex = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)")/gi;
    let match: RegExpExecArray | null;
    while ((match = headerRegex.exec(cleanCommand)) !== null) {
      const rawHeader = match[1] || match[2] || '';
      const colonIndex = rawHeader.indexOf(':');
      if (colonIndex > 0) {
        const key = rawHeader.substring(0, colonIndex).trim();
        const value = rawHeader.substring(colonIndex + 1).trim();

        if (key.toLowerCase() === 'cookie') {
          cookies = value;
        } else {
          headers[key] = value;
        }
      }
    }

    // ۴. استخراج Cookies از فلگ -b یا --cookie
    const cookieFlagMatch = cleanCommand.match(/(?:-b|--cookie)\s+(?:'([^']+)'|"([^"]+)")/i);
    if (cookieFlagMatch) {
      cookies = cookieFlagMatch[1] || cookieFlagMatch[2] || '';
    }

    // ۵. استخراج Data / Body
    const dataRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(?:'([\s\S]*?)'|"([\s\S]*?)")/i;
    const dataMatch = cleanCommand.match(dataRegex);
    if (dataMatch) {
      body = dataMatch[1] || dataMatch[2] || '';
      if (!methodMatch) {
        method = 'POST';
      }
    }

    if (!url) {
      throw new Error('آدرس اینترنتی (URL) در دستور cURL یافت نشد.');
    }

    return {
      targetUrl: url,
      method,
      headers,
      bodyTemplate: body,
      cookies,
    };
  }

  /**
   * تشخیص نوع پلتفرم کارگزاری بر اساس URL و ساختار هدرها
   */
  public static detectBroker(url: string, headers: Record<string, string>): ParsedBrokerInfo {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('tadbirpardaz') || lowerUrl.includes('onlineplus') || lowerUrl.includes('online.')) {
      return { id: 'tadbir', name: 'سامانه تدبیر پرداز (Online Plus)' };
    }
    if (lowerUrl.includes('emofid') || lowerUrl.includes('easytrader')) {
      return { id: 'easytrader', name: 'ایزی‌تریدر کارگزاری مفید' };
    }
    if (lowerUrl.includes('rayan') || lowerUrl.includes('customerorder')) {
      return { id: 'rayan', name: 'سامانه رایان بورس' };
    }
    if (lowerUrl.includes('farabi') || lowerUrl.includes('farabixo')) {
      return { id: 'farabi', name: 'فارابیکسو کارگزاری فارابی' };
    }
    if (lowerUrl.includes('sahra')) {
      return { id: 'sahra', name: 'سامانه صحرا پروتکل' };
    }

    return { id: 'custom', name: 'کارگزاری شناسایی شده (cURL اختصاصی)' };
  }

  /**
   * استخراج مشخصات هویتی و توکن کاربر از Authorization JWT و هدرها
   */
  public static extractAccountInfo(
    headers: Record<string, string>,
    body: string,
    brokerName: string
  ): AccountInfo {
    const authHeader = headers['Authorization'] || headers['authorization'] || '';

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const jwtInfo = this.decodeJwtPayload(token);
      if (jwtInfo) {
        return {
          customerTitle: jwtInfo.title || 'کاربر احراز هویت شده',
          customerCode: jwtInfo.code || 'کد کاربری تایید شده',
          brokerName,
          tokenExpiresAt: jwtInfo.expiresAt,
          minutesLeft: jwtInfo.minutesLeft,
          isTokenExpired: jwtInfo.isExpired,
          authType: 'BEARER_JWT',
        };
      }
    }

    // اگر توکن Bearer نبود، از بدنه JSON یا هدر کوکی تلاش می‌کنیم
    try {
      if (body) {
        const json = JSON.parse(body);
        const code = json.CustomerId || json.CustomerCode || json.AccountId || json.nsccode;
        const title = json.CustomerTitle || json.CustomerName;
        if (code || title) {
          return {
            customerTitle: title || 'کاربر متصل',
            customerCode: String(code || 'شناسه کاربری'),
            brokerName,
            authType: headers['Cookie'] || headers['cookie'] ? 'SESSION_COOKIE' : 'BASIC',
          };
        }
      }
    } catch {}

    const hasCookies = !!(headers['Cookie'] || headers['cookie']);
    return {
      customerTitle: hasCookies ? 'نشست فعال (Session Cookie)' : 'در انتظار ورود cURL معتبر',
      customerCode: hasCookies ? 'احراز هویت کوکی' : 'بدون نشست',
      brokerName,
      authType: hasCookies ? 'SESSION_COOKIE' : 'NONE',
    };
  }

  /**
   * دیکود کردن پی‌لود توکن JWT بدون نیاز به کلید عمومی
   */
  private static decodeJwtPayload(token: string): {
    title?: string;
    code?: string;
    expiresAt?: string;
    minutesLeft?: number;
    isExpired?: boolean;
  } | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(jsonStr);

      const title =
        payload.name ||
        payload.unique_name ||
        payload.CustomerTitle ||
        payload.preferred_username ||
        payload.given_name ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];

      const code =
        payload.CustomerId ||
        payload.CustomerCode ||
        payload.sub ||
        payload.national_code ||
        payload.nationalCode ||
        payload.username ||
        payload.id;

      let expiresAt: string | undefined;
      let minutesLeft: number | undefined;
      let isExpired: boolean | undefined;

      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        expiresAt = expDate.toLocaleTimeString('fa-IR');
        const nowMs = Date.now();
        const diffMs = expDate.getTime() - nowMs;
        minutesLeft = Math.round(diffMs / 60000);
        isExpired = diffMs <= 0;
      }

      return { title, code: code ? String(code) : undefined, expiresAt, minutesLeft, isExpired };
    } catch {
      return null;
    }
  }

  /**
   * استخراج هوشمند نماد، قیمت و تعداد از بدنه درخواست کارگزاری
   */
  public static extractOrderData(body: string): {
    symbol?: string;
    price?: number;
    quantity?: number;
    isin?: string;
    side?: 'BUY' | 'SELL';
  } {
    if (!body) return {};

    try {
      const json = JSON.parse(body);
      const isin = json.Isin || json.isin || json.InstrumentId || json.instrumentId || json.NSCCode;
      const price = json.OrderPrice || json.price || json.Price;
      const quantity = json.OrderQuantity || json.quantity || json.Quantity || json.volume || json.Volume;
      const rawSide = json.OrderSide || json.side || json.Side;

      let symbol = json.Symbol || json.symbol;

      // اگر نماد صریح نبود اما ISIN وجود داشت، از دیتابیس نمادهای بورس پیدا می‌کنیم
      if (!symbol && isin) {
        const map = this.loadSymbolsMap();
        const found = map.get(String(isin).toUpperCase());
        if (found) {
          symbol = found.symbol;
        }
      }

      return {
        symbol,
        isin: isin ? String(isin) : undefined,
        price: typeof price === 'number' ? price : (price ? parseInt(price, 10) : undefined),
        quantity: typeof quantity === 'number' ? quantity : (quantity ? parseInt(quantity, 10) : undefined),
        side: rawSide === 2 || rawSide === 'SELL' || rawSide === 'sell' ? 'SELL' : 'BUY',
      };
    } catch {
      return {};
    }
  }

  /**
   * اعمال متغیرهای نماد، قیمت و تعداد در بدنه درخواست
   */
  public static injectVariables(
    template: string,
    variables: { symbol: string; price: number; quantity: number }
  ): string {
    if (!template) return '';

    let replaced = template;

    // جایگزینی الگوهای عمومی صریح
    replaced = replaced.replace(/\{\{symbol\}\}/gi, variables.symbol);
    replaced = replaced.replace(/\{\{price\}\}/gi, variables.price.toString());
    replaced = replaced.replace(/\{\{quantity\}\}/gi, variables.quantity.toString());

    try {
      const parsed = JSON.parse(replaced);
      let changed = false;

      for (const key of Object.keys(parsed)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'price' || lowerKey === 'orderprice') {
          parsed[key] = variables.price;
          changed = true;
        } else if (lowerKey === 'quantity' || lowerKey === 'orderquantity' || lowerKey === 'volume') {
          parsed[key] = variables.quantity;
          changed = true;
        } else if (lowerKey === 'symbol' || lowerKey === 'nsccode' || lowerKey === 'symboltitle') {
          if (variables.symbol) {
            parsed[key] = variables.symbol;
            changed = true;
          }
        }
      }

      if (changed) {
        return JSON.stringify(parsed);
      }
    } catch {}

    return replaced;
  }
}
