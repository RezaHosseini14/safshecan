import { Module, Global } from '@nestjs/common';
import { ConnectionPoolService } from './connection-pool.service.js';
import { ConnectionPoolController } from './connection-pool.controller.js';

@Global()
@Module({
  controllers: [ConnectionPoolController],
  providers: [ConnectionPoolService],
  exports: [ConnectionPoolService],
})
export class ConnectionPoolModule {}
