import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { DistributedLockService } from './distributed-lock.service.js';
import { RedisBroadcasterService } from './redis-broadcaster.service.js';
import { QueueService } from '../queues/queue.service.js';

@Global()
@Module({
  providers: [
    RedisService,
    DistributedLockService,
    RedisBroadcasterService,
    QueueService,
  ],
  exports: [
    RedisService,
    DistributedLockService,
    RedisBroadcasterService,
    QueueService,
  ],
})
export class RedisModule {}
