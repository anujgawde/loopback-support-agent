import { Module } from '@nestjs/common';
import { SlackModule as NestSlackModule } from 'nestjs-slack-bolt';
import { AgentModule } from '../agent/agent.module';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';

@Module({
  imports: [NestSlackModule.forRoot(), AgentModule],
  controllers: [SlackController],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackBotModule {}
