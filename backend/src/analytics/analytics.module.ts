import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { KBModule } from '../kb/kb.module';
import { SupportLogModule } from '../support-log/support-log.module';

@Module({
  imports: [KBModule, SupportLogModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
