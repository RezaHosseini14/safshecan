import { Module, Global } from '@nestjs/common';
import { AppConfigService } from './config.service.js';
import { ConfigController } from './config.controller.js';

@Global()
@Module({
  controllers: [ConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
