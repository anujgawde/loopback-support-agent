import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { EmbeddingModule } from './embedding/embedding.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { NotionModule } from './notion/notion.module';
import { KBModule } from './kb/kb.module';
import { LLMModule } from './llm/llm.module';
import { GitHubModule } from './github/github.module';
import { SupportLogModule } from './support-log/support-log.module';
import { AgentModule } from './agent/agent.module';
import { SlackBotModule } from './slack/slack.module';

const optionalModules: any[] = [];
if (process.env.SLACK_BOT_TOKEN) {
  optionalModules.push(SlackBotModule);
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EmbeddingModule,
    QdrantModule,
    NotionModule,
    KBModule,
    LLMModule,
    GitHubModule,
    SupportLogModule,
    AgentModule,
    ...optionalModules,
  ],
})
export class AppModule {}
