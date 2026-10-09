import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { MarketDataController } from './market-data.controller.js';
import { MarketDataService } from './market-data.service.js';
import { SymbolsController } from './symbols.controller.js';
import { SymbolsService } from './symbols.service.js';
import { TsetmcClient } from './tsetmc.client.js';

@Module({
  imports: [RealtimeModule],
  controllers: [SymbolsController, MarketDataController],
  providers: [TsetmcClient, SymbolsService, MarketDataService],
  exports: [SymbolsService, TsetmcClient, MarketDataService],
})
export class MarketModule {}
