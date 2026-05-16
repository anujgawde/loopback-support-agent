import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KBArticle } from '../common/types';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private pipeline: any;
  private readonly logger = new Logger(EmbeddingService.name);
  readonly dimensions = 384;

  async onModuleInit() {
    this.logger.log('Loading embedding model (all-MiniLM-L6-v2)...');
    const { pipeline } = await import('@xenova/transformers');
    this.pipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );
    this.logger.log('Embedding model loaded.');
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(result.data);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  buildEmbeddableText(article: Partial<KBArticle>): string {
    const parts = [
      article.title,
      article.symptoms,
      article.triggerPhrases?.join(' '),
      article.rootCause,
    ].filter(Boolean);
    return parts.join(' ');
  }
}
