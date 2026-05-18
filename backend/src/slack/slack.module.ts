import { Module } from '@nestjs/common';
import { SlackModule as NestSlackModule } from 'nestjs-slack-bolt';
import { AgentModule } from '../agent/agent.module';
import { SlackController } from './slack.controller';

@Module({
  imports: [NestSlackModule.forRoot(), AgentModule],
  controllers: [SlackController],
})
export class SlackBotModule {}
