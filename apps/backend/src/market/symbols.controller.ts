import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { t } from '@saf-shekan/i18n';
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
  @ApiOperation({ summary: t('swagger', 'symbolList') })
  @ApiResponse({ status: 200, description: t('swagger', 'symbolListOk') })
  getSymbols(@Query() query: SymbolQueryDto): SymbolItem[] {
    try {
      const onlyIpo = query.onlyIpo === 'true' || query.onlyIpo === '1';
      const brief = query.brief === 'true' || query.brief === '1';
      const limit = query.limit != null ? Number(query.limit) : 150;
      return this.symbolsService.search(query.q, onlyIpo, query.market, limit, brief);
    } catch {
      return [];
    }
  }

  @Get('symbols/ipos')
  @HttpCode(200)
  @ApiOperation({ summary: t('swagger', 'ipoList') })
  @ApiResponse({ status: 200, description: t('swagger', 'ipoListOk') })
  getIpos(): SymbolItem[] {
    try {
      return this.symbolsService.getIpos();
    } catch {
      return [];
    }
  }

  @Get('symbols/status')
  @HttpCode(200)
  @ApiOperation({ summary: t('swagger', 'symbolSyncStatus') })
  @ApiResponse({ status: 200, description: t('swagger', 'symbolSyncStatusOk') })
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
  @ApiOperation({ summary: t('swagger', 'symbolRefresh') })
  @ApiResponse({ status: 200, description: t('swagger', 'symbolRefreshOk') })
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
              message: t('errors', 'syncTimeout', { count: status.totalSymbols }),
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
        message: t('errors', 'syncFailedCache', { count: status.totalSymbols, detail: message }),
      };
    }
  }
}
