import { Module } from '@nestjs/common';
import { KBModule } from '../kb/kb.module';
import { GitHubModule } from '../github/github.module';
import { SupportLogModule } from '../support-log/support-log.module';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [KBModule, GitHubModule, SupportLogModule],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
