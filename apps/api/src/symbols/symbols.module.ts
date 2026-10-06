import { Module } from '@nestjs/common';
import { SymbolsService } from './symbols.service.js';
import { SymbolsController } from './symbols.controller.js';

@Module({
  controllers: [SymbolsController],
  providers: [SymbolsService],
  exports: [SymbolsService],
})
export class SymbolsModule {}
