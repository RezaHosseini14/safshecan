import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SimulationService } from './simulation.service.js';
import { RunBacktestDto, RunHistoricalBacktestDto } from './dtos/simulation.dto.js';
import { HistoricalBacktestConfig } from './historical-backtester.js';

@ApiTags('Simulation & Backtesting')
@Controller('api')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('backtest/run')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'اجرای شبیه‌سازی و بک‌تست جامع بازگشایی بازار (Opening Bell)' })
  @ApiResponse({ status: 200, description: 'گزارش تحلیلی بک‌تست بازگشایی' })
  async runOpeningBacktest(@Body() body: RunBacktestDto) {
    const report = await this.simulationService.runOpeningBacktest(body.runs || 5);
    return {
      success: true,
      report,
    };
  }

  @Get('historical/ipos')
  @ApiOperation({ summary: 'فهرست جامع عرضه‌های اولیه و نمادهای قفل صف بورس تهران' })
  @ApiResponse({ status: 200, description: 'فهرست ۳۹ عرضه اولیه تاریخی همراه با جزئیات صف' })
  getHistoricalIPOs() {
    const ipos = this.simulationService.getHistoricalIPOs();
    return {
      success: true,
      count: ipos.length,
      ipos,
    };
  }

  @Get('simulation/brokers')
  @ApiOperation({ summary: 'فهرست هسته‌های OMS کارگزاری‌های بورس و ویژگی‌های تاخیر آنها' })
  @ApiResponse({ status: 200, description: 'پروفایل‌های تاخیر OMS کارگزاری‌ها' })
  getBrokerProfiles() {
    const brokers = this.simulationService.getBrokerOMSProfiles();
    return {
      success: true,
      brokers,
    };
  }

  @Post('historical/backtest')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'اجرای بک‌تست تاریخی کوانت و شبیه‌سازی کارنامه سبد سهام' })
  @ApiResponse({ status: 200, description: 'گزارش سودآوری، نسبت شارپ، سورتینو، افت سرمایه و نرخ قبولی' })
  runHistoricalBacktest(@Body() body: RunHistoricalBacktestDto) {
    const config: HistoricalBacktestConfig = {
      initialCapitalToman: Number(body.initialCapitalToman) || 50_000_000,
      allocationMode: body.allocationMode || 'percent',
      fixedAllocationToman: Number(body.fixedAllocationToman) || 10_000_000,
      positionSizingPercent: Number(body.positionSizingPercent) || 30,
      connectionType: body.connectionType || 'fiber',
      customPingMs: typeof body.customPingMs === 'number' ? Number(body.customPingMs) : undefined,
      customJitterMs: typeof body.customJitterMs === 'number' ? Number(body.customJitterMs) : undefined,
      brokerOMS: body.brokerOMS || 'auto',
      leadTimeMs: typeof body.leadTimeMs === 'number' ? Number(body.leadTimeMs) : undefined,
      burstCount: Number(body.burstCount) || 5,
      burstIntervalMs: Number(body.burstIntervalMs) || 2.5,
      targetSymbols:
        Array.isArray(body.targetSymbols) && body.targetSymbols.length > 0
          ? body.targetSymbols
          : undefined,
      targetSectors:
        Array.isArray(body.targetSectors) && body.targetSectors.length > 0
          ? body.targetSectors
          : undefined,
      includeMonteCarlo: body.includeMonteCarlo ?? true,
      monteCarloIterations: Number(body.monteCarloIterations) || 150,
    };

    const report = this.simulationService.runHistoricalBacktest(config);
    return {
      success: true,
      report,
    };
  }

  @Post('historical/monte-carlo')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'اجرای شبیه‌سازی آماری چندمسیره مونت کارلو روی سبد عرضه‌های اولیه' })
  @ApiResponse({ status: 200, description: 'توزیع احتمالاتی بازدهی، صدک ۵٪ و ۹۵٪ و ریسک تباهی' })
  runMonteCarlo(@Body() body: RunHistoricalBacktestDto) {
    const config: HistoricalBacktestConfig = {
      initialCapitalToman: Number(body.initialCapitalToman) || 50_000_000,
      allocationMode: body.allocationMode || 'percent',
      fixedAllocationToman: Number(body.fixedAllocationToman) || 10_000_000,
      positionSizingPercent: Number(body.positionSizingPercent) || 30,
      connectionType: body.connectionType || 'fiber',
      brokerOMS: body.brokerOMS || 'auto',
      leadTimeMs: typeof body.leadTimeMs === 'number' ? Number(body.leadTimeMs) : undefined,
      burstCount: Number(body.burstCount) || 5,
      burstIntervalMs: Number(body.burstIntervalMs) || 2.5,
    };

    const iterations = Math.min(300, Math.max(30, Number(body.monteCarloIterations) || 150));
    const analysis = this.simulationService.runMonteCarlo(config, iterations);

    return {
      success: true,
      analysis,
    };
  }
}
