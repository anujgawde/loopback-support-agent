import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;
  private collectionName: string;
  private readonly logger = new Logger(QdrantService.name);

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
  ) {
    const url = this.configService.get<string>('QDRANT_URL');
    const apiKey = this.configService.get<string>('QDRANT_API_KEY');
    this.client = new QdrantClient({ url, apiKey: apiKey || undefined });
    this.collectionName =
      this.configService.get<string>('QDRANT_COLLECTION') || 'support-kb';
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  async ensureCollection() {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === this.collectionName,
    );
    if (!exists) {
      this.logger.log(`Creating collection "${this.collectionName}"...`);
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.embeddingService.dimensions,
          distance: 'Cosine',
        },
      });
      this.logger.log(`Collection "${this.collectionName}" created.`);
    }
  }

  async search(
    queryVector: number[],
    limit = 5,
    scoreThreshold = 0.5,
  ): Promise<{ id: string; score: number; payload: any }[]> {
    const results = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    });
    return results.map((r) => ({
      id: r.id as string,
      score: r.score,
      payload: r.payload,
    }));
  }

  async upsert(id: string, vector: number[], payload: Record<string, any>) {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async updatePayload(id: string, payload: Record<string, any>) {
    await this.client.setPayload(this.collectionName, {
      payload,
      points: [id],
    });
  }

  async delete(id: string) {
    await this.client.delete(this.collectionName, { points: [id] });
  }
}
