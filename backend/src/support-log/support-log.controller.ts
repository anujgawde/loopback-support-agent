import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { SupportLogService } from './support-log.service';

@Controller('logs')
export class SupportLogController {
  constructor(private supportLogService: SupportLogService) {}

  @Get()
  async getAll() {
    return this.supportLogService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.supportLogService.getById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'Pending Review' | 'Sent' | 'Resolved' | 'Dismissed',
  ) {
    return this.supportLogService.updateStatus(id, status);
  }

  @Patch(':id/kb-created')
  async markKbArticleCreated(@Param('id') id: string) {
    return this.supportLogService.markKbArticleCreated(id);
  }
}
