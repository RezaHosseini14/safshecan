import { Module } from '@nestjs/common';
import { FrontendController } from './frontend.controller.js';

@Module({
  controllers: [FrontendController],
})
export class FrontendModule {}
