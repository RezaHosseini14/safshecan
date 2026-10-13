import { Global, Module } from '@nestjs/common';
import { EnvelopeCipherService } from './envelope-cipher.service.js';
import { IdempotencyService } from './idempotency.service.js';

@Global()
@Module({
  providers: [EnvelopeCipherService, IdempotencyService],
  exports: [EnvelopeCipherService, IdempotencyService],
})
export class SecurityModule {}
