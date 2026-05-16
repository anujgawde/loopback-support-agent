import { Injectable, Logger } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { KBArticle, KBMatch } from '../common/types';

@Injectable()
export class KBService {
  private readonly logger = new Logger(KBService.name);

  constructor(
    private notionService: NotionService,
    private qdrantService: QdrantService,
    private embeddingService: EmbeddingService,
  ) {}

  async search(query: string, limit = 5): Promise<KBMatch[]> {
    const queryVector = await this.embeddingService.embed(query);
    const results = await this.qdrantService.search(queryVector, limit, 0.5);

    const matches: KBMatch[] = [];
    for (const result of results) {
      try {
        const article = await this.notionService.getArticle(result.id);
        matches.push({ article, similarityScore: result.score });
      } catch (err) {
        this.logger.warn(`Failed to fetch article ${result.id}: ${err.message}`);
      }
    }

    return matches;
  }

  async createArticle(
    draft: Omit<KBArticle, 'id' | 'notionUrl'>,
  ): Promise<KBArticle> {
    const article = await this.notionService.createKBArticle(draft);

    const text = this.embeddingService.buildEmbeddableText(article);
    const vector = await this.embeddingService.embed(text);
    await this.qdrantService.upsert(article.id, vector, {
      title: article.title,
      category: article.category,
    });

    return article;
  }

  async updateArticle(
    id: string,
    updates: Partial<KBArticle>,
  ): Promise<void> {
    await this.notionService.updateKBArticle(id, updates);

    const needsReembed =
      updates.symptoms !== undefined ||
      updates.triggerPhrases !== undefined ||
      updates.rootCause !== undefined ||
      updates.title !== undefined;

    if (needsReembed) {
      const article = await this.notionService.getArticle(id);
      const text = this.embeddingService.buildEmbeddableText(article);
      const vector = await this.embeddingService.embed(text);
      await this.qdrantService.upsert(id, vector, {
        title: article.title,
        category: article.category,
      });
    } else {
      const payload: Record<string, any> = {};
      if (updates.frequency !== undefined) payload.frequency = updates.frequency;
      if (updates.lastSeen !== undefined) payload.lastSeen = updates.lastSeen;
      if (Object.keys(payload).length > 0) {
        await this.qdrantService.updatePayload(id, payload);
      }
    }
  }

  async bumpFrequency(id: string, currentFrequency: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.notionService.updateKBArticle(id, {
      frequency: currentFrequency + 1,
      lastSeen: today,
    });
    await this.qdrantService.updatePayload(id, {
      frequency: currentFrequency + 1,
      lastSeen: today,
    });
  }

  async getArticle(id: string): Promise<KBArticle> {
    return this.notionService.getArticle(id);
  }

  async getAllArticles(): Promise<KBArticle[]> {
    return this.notionService.getAllArticles();
  }

  async sync(): Promise<{ synced: number }> {
    this.logger.log('Starting full KB sync...');
    const articles = await this.notionService.getAllArticles();

    for (const article of articles) {
      const text = this.embeddingService.buildEmbeddableText(article);
      const vector = await this.embeddingService.embed(text);
      await this.qdrantService.upsert(article.id, vector, {
        title: article.title,
        category: article.category,
      });
    }

    this.logger.log(`Synced ${articles.length} articles to Qdrant.`);
    return { synced: articles.length };
  }
}
