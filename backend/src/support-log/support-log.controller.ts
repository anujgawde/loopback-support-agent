import { Controller, Get, Param } from '@nestjs/common';
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
}
