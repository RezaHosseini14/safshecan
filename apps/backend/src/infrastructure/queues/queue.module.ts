import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service.js';
import { OrderDurabilityService } from './order-durability.service.js';

@Global()
@Module({
  providers: [QueueService, OrderDurabilityService],
  exports: [QueueService, OrderDurabilityService],
})
export class QueueModule {}
