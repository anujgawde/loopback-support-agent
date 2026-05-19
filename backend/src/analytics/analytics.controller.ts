import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('stats')
  async getStats() {
    return this.analyticsService.getStats();
  }

  @Get('config')
  getConfig() {
    return this.analyticsService.getAppConfig();
  }
}
