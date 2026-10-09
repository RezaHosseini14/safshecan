import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SymbolsService, SymbolItem, SyncStatus } from './symbols.service.js';
import { SymbolQueryDto } from './dto/symbol-query.dto.js';

@ApiTags('Symbols')
@SkipThrottle()
@Controller('api')
export class SymbolsController {
  constructor(private readonly symbolsService: SymbolsService) {}

  @Get('symbols')
  @HttpCode(200)
  @ApiOperation({ summary: 'فهرست نمادها با جستجو/فیلتر (پیش‌فرض حداکثر ۱۵۰ مورد)' })
  @ApiResponse({ status: 200, description: 'فهرست نمادها' })
  getSymbols(@Query() query: SymbolQueryDto): SymbolItem[] {
    try {
      const onlyIpo = query.onlyIpo === 'true' || query.onlyIpo === '1';
      const limit = query.limit != null ? Number(query.limit) : 150;
      return this.symbolsService.search(query.q, onlyIpo, query.market, limit);
    } catch {
      return [];
    }
  }

  @Get('symbols/ipos')
  @HttpCode(200)
  @ApiOperation({ summary: 'فهرست ویژه عرضه‌های اولیه فعال، جاری و آتی بورس' })
  @ApiResponse({ status: 200, description: 'فهرست عرضه‌های اولیه' })
  getIpos(): SymbolItem[] {
    try {
      return this.symbolsService.getIpos();
    } catch {
      return [];
    }
  }

  @Get('symbols/status')
  @HttpCode(200)
  @ApiOperation({ summary: 'وضعیت همگام‌سازی و آمار دیتابیس نمادها' })
  @ApiResponse({ status: 200, description: 'وضعیت همگام‌سازی نمادها' })
  getStatus(): SyncStatus {
    try {
      return this.symbolsService.getStatus();
    } catch {
      return {
        totalSymbols: 0,
        ipoCount: 0,
        lastSyncTime: null,
        isSyncing: false,
        lastError: 'status unavailable',
      };
    }
  }

  @Post('symbols/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'همگام‌سازی و بروزرسانی آنی نمادها و عرضه‌های اولیه از بورس (TSETMC)' })
  @ApiResponse({ status: 200, description: 'نتیجه همگام‌سازی لحظه‌ای' })
  async refreshSymbols() {
    try {
      return await Promise.race([
        this.symbolsService.syncFromTsetmc(),
        new Promise<{
          success: boolean;
          totalSymbols: number;
          ipoCount: number;
          newIpos: string[];
          message: string;
        }>((resolve) => {
          setTimeout(() => {
            const status = this.symbolsService.getStatus();
            resolve({
              success: false,
              totalSymbols: status.totalSymbols,
              ipoCount: status.ipoCount,
              newIpos: [],
              message: `مهلت همگام‌سازی تمام شد — ${status.totalSymbols} نماد از کش محلی قابل استفاده است.`,
            });
          }, 18000);
        }),
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status = this.symbolsService.getStatus();
      return {
        success: false,
        totalSymbols: status.totalSymbols,
        ipoCount: status.ipoCount,
        newIpos: [] as string[],
        message: `همگام‌سازی ناموفق — کش محلی برقرار است (${status.totalSymbols} نماد). ${message}`,
      };
    }
  }
}
