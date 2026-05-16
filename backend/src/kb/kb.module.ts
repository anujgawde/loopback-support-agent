import { Module } from '@nestjs/common';
import { KBService } from './kb.service';
import { KBController } from './kb.controller';

@Module({
  controllers: [KBController],
  providers: [KBService],
  exports: [KBService],
})
export class KBModule {}
