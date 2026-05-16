import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingModule } from './embedding/embedding.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { NotionModule } from './notion/notion.module';
import { KBModule } from './kb/kb.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmbeddingModule,
    QdrantModule,
    NotionModule,
    KBModule,
  ],
})
export class AppModule {}
