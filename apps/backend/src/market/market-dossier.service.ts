import { Injectable } from '@nestjs/common';
import { t } from '@saf-shekan/i18n';
import { MarketDataService } from './market-data.service.js';
import { SymbolsService } from './symbols.service.js';
import {
  RawDailyClose,
  RawInstrumentInfo,
  RawTradePrint,
  TsetmcClient,
  normalizePersian,
} from './tsetmc.client.js';
import { LiveQuote } from './market-data.types.js';
import { CleanDaily, CleanTrade, DossierAssembleInput, FlowSlice, MarketDossier } from './market-dossier.types.js';
import { assembleDossier, emptyDossier, positiveNumber } from './dossier-rules.js';

const DOSSIER_TTL_MS = 15_000;

interface FlowMemory {
  atMs: number;
  flow: FlowSlice;
}

@Injectable()
export class MarketDossierService {
  private readonly cache = new Map<string, { at: number; dossier: MarketDossier }>();
  private readonly flows = new Map<string, FlowMemory>();

  constructor(
    private readonly marketData: MarketDataService,
    private readonly symbols: SymbolsService,
    private readonly tsetmc: TsetmcClient
  ) {}

  public async getDossier(symbol: string, force = false): Promise<MarketDossier> {
    const key = normalizePersian((symbol || '').trim());
    if (!key) return emptyDossier('', t('errors', 'symbolMissing'));
    const cached = this.cache.get(key);
    if (!force && cached && Date.now() - cached.at < DOSSIER_TTL_MS) return cached.dossier;
    try {
      const dossier = await this.load(key);
      this.cache.set(key, { at: Date.now(), dossier });
      return dossier;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common', 'unknownError');
      return emptyDossier(key, message);
    }
  }

  private async load(symbol: string): Promise<MarketDossier> {
    const nowMs = Date.now();
    const catalogItem = this.symbols.getBySymbol(symbol);
    const quote = await this.marketData.getQuote(symbol, true);
    const insCode = quote.insCode || catalogItem?.insCode || '';
    const warnings: string[] = [];
    if (!insCode) warnings.push(t('errors', 'insCodeMissing'));

    const [tradesResult, dailyResult, infoResult] = await Promise.allSettled([
      insCode ? this.tsetmc.fetchTrades(insCode) : Promise.resolve([] as RawTradePrint[]),
      insCode ? this.tsetmc.fetchDailyCloses(insCode, 60) : Promise.resolve([] as RawDailyClose[]),
      insCode ? this.tsetmc.fetchInstrumentInfo(insCode) : Promise.resolve(null),
    ]);

    const tradesStatus = this.statusOf(tradesResult, Boolean(insCode));
    const dailyStatus = this.statusOf(dailyResult, Boolean(insCode));
    if (tradesStatus === 'failed') warnings.push(t('errors', 'tradesMissing'));
    if (dailyStatus === 'failed') warnings.push(t('errors', 'historyMissing'));
    if (infoResult.status === 'rejected') warnings.push(t('errors', 'identityMissing'));

    const rawTrades = tradesResult.status === 'fulfilled' ? tradesResult.value : [];
    const rawDaily = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
    const info = infoResult.status === 'fulfilled' ? infoResult.value : null;
    const flow = this.toFlow(quote);
    const previous = insCode ? (this.flows.get(insCode) ?? null) : null;
    if (insCode && flow) this.flows.set(insCode, { atMs: nowMs, flow });

    const input: DossierAssembleInput = {
      symbol: quote.symbol && quote.symbol !== '—' ? quote.symbol : catalogItem?.symbol || symbol,
      nowMs,
      quote: this.toQuote(quote),
      catalog: {
        pe: positiveNumber(catalogItem?.pe),
        eps:
          positiveNumber(catalogItem?.eps) ??
          positiveNumber(info?.eps?.estimatedEPS) ??
          positiveNumber(info?.eps?.epsValue),
        group: catalogItem?.group?.trim() || null,
        baseVolume: positiveNumber(catalogItem?.baseVolume),
      },
      trades: rawTrades.flatMap((row) => this.toTrade(row)),
      tradesStatus,
      daily: rawDaily.flatMap((row) => this.toDaily(row)),
      dailyStatus,
      instrument: this.toInstrument(info),
      previousFlow: previous,
      warnings,
    };
    return assembleDossier(input);
  }

  private statusOf<T>(result: PromiseSettledResult<T>, attempted: boolean): 'ok' | 'failed' | 'skipped' {
    if (!attempted) return 'skipped';
    return result.status === 'fulfilled' ? 'ok' : 'failed';
  }

  private toQuote(quote: LiveQuote): DossierAssembleInput['quote'] {
    const change = Number(quote.changePercent);
    return {
      ok: quote.ok,
      source: quote.source,
      lastPrice: Number(quote.lastPrice) || 0,
      changePercent: Number.isFinite(change) ? change : null,
      volume: Number(quote.volume) || 0,
      pMax: positiveNumber(quote.pMax),
      pMin: positiveNumber(quote.pMin),
      stateTitle: quote.stateTitle?.trim() || null,
      underSupervision: quote.underSupervision ?? null,
      clientFlow: this.toFlow(quote),
      orderBookLength: quote.orderBook?.length ?? 0,
      warning: quote.warning,
    };
  }

  private toFlow(quote: LiveQuote): FlowSlice | null {
    const flow = quote.clientFlow;
    if (!flow) return null;
    return {
      buyIndividualVolume: Number(flow.buyIndividualVolume) || 0,
      buyLegalVolume: Number(flow.buyLegalVolume) || 0,
      sellIndividualVolume: Number(flow.sellIndividualVolume) || 0,
      sellLegalVolume: Number(flow.sellLegalVolume) || 0,
    };
  }

  private toTrade(row: RawTradePrint): CleanTrade[] {
    if (Number(row.canceled || 0) !== 0) return [];
    const price = positiveNumber(row.pTran);
    const volume = positiveNumber(row.qTitTran);
    if (price == null || volume == null) return [];
    return [{ hEven: Number(row.hEven) || 0, dEven: Number(row.dEven) || 0, price, volume }];
  }

  private toDaily(row: RawDailyClose): CleanDaily[] {
    const close = positiveNumber(row.pClosing) ?? positiveNumber(row.pDrCotVal);
    const dEven = Number(row.dEven) || 0;
    if (close == null || dEven <= 0) return [];
    return [
      {
        dEven,
        open: positiveNumber(row.priceFirst) ?? close,
        high: positiveNumber(row.priceMax) ?? close,
        low: positiveNumber(row.priceMin) ?? close,
        close,
        volume: positiveNumber(row.qTotTran5J) ?? 0,
      },
    ];
  }

  private toInstrument(info: RawInstrumentInfo | null): DossierAssembleInput['instrument'] {
    if (!info) {
      return {
        received: false,
        group: null,
        sharesOutstanding: null,
        floatShares: null,
        floatPercent: null,
      };
    }
    const shares = positiveNumber(info.zTitad);
    const looseFreeFloat = positiveNumber(info.freeFloat);
    const freeFloatShares = looseFreeFloat != null && looseFreeFloat > 100 ? looseFreeFloat : null;
    const freeFloatPercent = looseFreeFloat != null && looseFreeFloat <= 100 ? looseFreeFloat : null;
    let floatShares = positiveNumber(info.floatShares) ?? positiveNumber(info.floatingShares) ?? freeFloatShares;
    let floatPercent =
      this.percent(info.floatPercent) ??
      this.percent(info.floatingPercent) ??
      this.percent(info.freeFloatPercent) ??
      freeFloatPercent;
    if (floatPercent == null && floatShares != null && shares != null && floatShares <= shares) {
      floatPercent = (floatShares / shares) * 100;
    }
    if (floatShares == null && floatPercent != null && shares != null) {
      floatShares = Math.round((floatPercent / 100) * shares);
    }
    const group = info.sector?.lSecVal?.trim() || info.cgrValCotTitle?.trim() || null;
    return {
      received: true,
      group,
      sharesOutstanding: shares,
      floatShares,
      floatPercent,
    };
  }

  private percent(value: unknown): number | null {
    const parsed = positiveNumber(value);
    if (parsed == null || parsed > 100) return null;
    return parsed;
  }
}
