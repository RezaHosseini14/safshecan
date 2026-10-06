import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SymbolsService, SymbolItem, SyncStatus } from './symbols.service.js';
import { SymbolQueryDto } from './dtos/symbol-query.dto.js';

@ApiTags('Symbols')
@Controller('api')
export class SymbolsController {
  constructor(private readonly symbolsService: SymbolsService) {}

  @Get('symbols')
  @ApiOperation({ summary: 'فهرست جامع نمادهای بورس و فرابورس با قابلیت جستجو و فیلتر عرضه اولیه' })
  @ApiResponse({ status: 200, description: 'فهرست نمادها' })
  getSymbols(@Query() query: SymbolQueryDto): SymbolItem[] {
    const onlyIpo = query.onlyIpo === 'true' || query.onlyIpo === '1';
    return this.symbolsService.search(query.q, onlyIpo, query.market);
  }

  @Get('symbols/ipos')
  @ApiOperation({ summary: 'فهرست ویژه عرضه‌های اولیه فعال، جاری و آتی بورس' })
  @ApiResponse({ status: 200, description: 'فهرست عرضه‌های اولیه' })
  getIpos(): SymbolItem[] {
    return this.symbolsService.getIpos();
  }

  @Get('symbols/status')
  @ApiOperation({ summary: 'وضعیت همگام‌سازی و آمار دیتابیس نمادها' })
  @ApiResponse({ status: 200, description: 'وضعیت همگام‌سازی نمادها' })
  getStatus(): SyncStatus {
    return this.symbolsService.getStatus();
  }

  @Post('symbols/refresh')
  @ApiOperation({ summary: 'همگام‌سازی و بروزرسانی آنی نمادها و عرضه‌های اولیه از بورس (TSETMC)' })
  @ApiResponse({ status: 200, description: 'نتیجه همگام‌سازی لحظه‌ای' })
  async refreshSymbols() {
    return await this.symbolsService.syncFromTsetmc();
  }
}
