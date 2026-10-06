import { Injectable } from '@nestjs/common';
import { BacktestRunner, FullBacktestReport } from './backtest-runner.js';
import {
  HistoricalBacktester,
  HistoricalIPO,
  HistoricalBacktestReport,
  HistoricalBacktestConfig,
  BROKER_OMS_PROFILES,
  BrokerOMSProfile,
  MonteCarloAnalysis,
} from './historical-backtester.js';

@Injectable()
export class SimulationService {
  public async runOpeningBacktest(runs: number = 5): Promise<FullBacktestReport> {
    const validRuns = Math.min(15, Math.max(2, runs));
    return await BacktestRunner.runFullBacktest(validRuns);
  }

  public getHistoricalIPOs(): HistoricalIPO[] {
    return HistoricalBacktester.loadHistoricalIPOs();
  }

  public getBrokerOMSProfiles(): Record<string, BrokerOMSProfile> {
    return BROKER_OMS_PROFILES;
  }

  public runHistoricalBacktest(config: HistoricalBacktestConfig): HistoricalBacktestReport {
    return HistoricalBacktester.runBacktest(config);
  }

  public runMonteCarlo(
    config: HistoricalBacktestConfig,
    iterations = 150
  ): MonteCarloAnalysis {
    return HistoricalBacktester.runMonteCarlo(config, iterations);
  }
}
