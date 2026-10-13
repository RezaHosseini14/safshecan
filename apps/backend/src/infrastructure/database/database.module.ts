import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { DRIZZLE_DB, getDrizzleDatabase } from './database.js';
import { EnvelopeCipherService } from '../security/envelope-cipher.service.js';
import { BootstrapMigrationService } from './bootstrap-migration.service.js';

@Global()
@Module({
  providers: [
    DatabaseService,
    EnvelopeCipherService,
    BootstrapMigrationService,
    {
      provide: DRIZZLE_DB,
      useFactory: () => getDrizzleDatabase(),
    },
  ],
  exports: [DatabaseService, DRIZZLE_DB, EnvelopeCipherService, BootstrapMigrationService],
})
export class DatabaseModule {}
