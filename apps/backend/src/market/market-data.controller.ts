import { Body, Controller, Delete, Get, Header, HttpCode, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MarketDataService } from './market-data.service.js';
import { MarketDossierService } from './market-dossier.service.js';
import { PersianSpeechService } from './persian-speech.service.js';
import { MarketQuoteQueryDto, MarketSpeechBodyDto, MarketWatchBodyDto } from './dto/market-data.dto.js';
import { LiveQuote, MarketDataStatus } from './market-data.types.js';
import { MarketDossier } from './market-dossier.types.js';

@ApiTags('Market Data')
@SkipThrottle()
@Controller('api/market')
export class MarketDataController {
  constructor(
    private readonly marketData: MarketDataService,
    private readonly dossier: MarketDossierService,
    private readonly speech: PersianSpeechService
  ) {}

  @Get('status')
  @HttpCode(200)
  @ApiOperation({ summary: t('swagger', 'marketStatus') })
  @ApiResponse({ status: 200, description: t('swagger', 'marketStatusOk') })
  getStatus(): MarketDataStatus {
    try {
      return this.marketData.getStatus();
    } catch {
      return {
        watchlist: [],
        lastPollAt: null,
        lastError: 'status unavailable',
        isPolling: false,
        cachedQuotes: 0,
      };
    }
  }

  @Get('quote')
  @HttpCode(200)
  @ApiOperation({
    summary: t('swagger', 'quote'),
  })
  @ApiResponse({ status: 200, description: t('swagger', 'quoteOk') })
  async getQuote(
    @Query() query: MarketQuoteQueryDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LiveQuote> {
    res.status(200);
    const force = query.force === 'true' || query.force === '1';
    try {
      return await this.marketData.getQuote(query.symbol || '', force);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common', 'unknownError');
      return {
        ok: false,
        degraded: true,
        warning: msg,
        symbol: query.symbol || '—',
        name: query.symbol || '—',
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
        stateTitle: t('common', 'noData'),
        orderBook: [],
        clientFlow: null,
        fetchedAt: new Date().toISOString(),
        source: 'EMPTY',
      };
    }
  }

  @Get('dossier')
  @HttpCode(200)
  @ApiOperation({
    summary: t('swagger', 'dossier'),
  })
  @ApiResponse({ status: 200, description: t('swagger', 'dossierOk') })
  async getDossier(
    @Query() query: MarketQuoteQueryDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<MarketDossier> {
    res.status(200);
    const force = query.force === 'true' || query.force === '1';
    return this.dossier.getDossier(query.symbol || '', force);
  }

  @Post('speech')
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @Header('Content-Type', 'audio/mpeg')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: t('swagger', 'speech') })
  @ApiResponse({ status: 200, description: t('swagger', 'speechOk') })
  async speak(@Body() body: MarketSpeechBodyDto): Promise<StreamableFile> {
    const audio = await this.speech.synthesize(body.text);
    return new StreamableFile(audio);
  }

  @Post('watch')
  @HttpCode(200)
  @ApiOperation({ summary: t('swagger', 'watchAdd') })
  watch(@Body() body: MarketWatchBodyDto) {
    return this.marketData.watch(body?.symbol || '');
  }

  @Delete('watch')
  @HttpCode(200)
  @ApiOperation({ summary: t('swagger', 'watchRemove') })
  unwatch(@Query('symbol') symbol?: string) {
    return this.marketData.unwatch(symbol || '');
  }
}
