import { Body, Controller, Delete, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { MarketDataService } from './market-data.service.js';
import { MarketQuoteQueryDto, MarketWatchBodyDto } from './dto/market-data.dto.js';
import { LiveQuote, MarketDataStatus } from './market-data.types.js';

@ApiTags('Market Data')
@SkipThrottle()
@Controller('api/market')
export class MarketDataController {
  constructor(private readonly marketData: MarketDataService) {}

  @Get('status')
  @HttpCode(200)
  @ApiOperation({ summary: 'وضعیت پایش لحظه‌ای بازار (watchlist / poll)' })
  @ApiResponse({ status: 200, description: 'وضعیت Market Data' })
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
    summary: 'قیمت لحظه‌ای، حجم معاملات، صف خرید/فروش و حقیقی/حقوقی یک نماد از TSETMC',
  })
  @ApiResponse({ status: 200, description: 'نقل‌قول زنده نماد (همیشه 200)' })
  async getQuote(
    @Query() query: MarketQuoteQueryDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LiveQuote> {
    res.status(200);
    const force = query.force === 'true' || query.force === '1';
    try {
      return await this.marketData.getQuote(query.symbol || '', force);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ناشناخته';
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
        stateTitle: 'بدون داده',
        orderBook: [],
        clientFlow: null,
        fetchedAt: new Date().toISOString(),
        source: 'EMPTY',
      };
    }
  }

  @Post('watch')
  @HttpCode(200)
  @ApiOperation({ summary: 'افزودن نماد به watchlist پایش لحظه‌ای (پخش روی WebSocket)' })
  watch(@Body() body: MarketWatchBodyDto) {
    return this.marketData.watch(body?.symbol || '');
  }

  @Delete('watch')
  @HttpCode(200)
  @ApiOperation({ summary: 'حذف نماد از watchlist' })
  unwatch(@Query('symbol') symbol?: string) {
    return this.marketData.unwatch(symbol || '');
  }
}
