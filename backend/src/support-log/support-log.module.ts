import { Module } from '@nestjs/common';
import { SupportLogService } from './support-log.service';
import { SupportLogController } from './support-log.controller';

@Module({
  providers: [SupportLogService],
  controllers: [SupportLogController],
  exports: [SupportLogService],
})
export class SupportLogModule {}
