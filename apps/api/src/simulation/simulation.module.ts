import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service.js';
import { SimulationController } from './simulation.controller.js';

@Module({
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
