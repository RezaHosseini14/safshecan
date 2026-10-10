import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { MarketDataController } from './market-data.controller.js';
import { MarketDataService } from './market-data.service.js';
import { MarketDossierService } from './market-dossier.service.js';
import { PersianSpeechService } from './persian-speech.service.js';
import { SymbolsController } from './symbols.controller.js';
import { SymbolsService } from './symbols.service.js';
import { TsetmcClient } from './tsetmc.client.js';

@Module({
  imports: [RealtimeModule],
  controllers: [SymbolsController, MarketDataController],
  providers: [TsetmcClient, SymbolsService, MarketDataService, MarketDossierService, PersianSpeechService],
  exports: [SymbolsService, TsetmcClient, MarketDataService, MarketDossierService],
})
export class MarketModule {}
