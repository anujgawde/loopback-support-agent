import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { NotionModule } from '../notion/notion.module';
import { KBModule } from '../kb/kb.module';
import { KBService } from '../kb/kb.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmbeddingModule,
    QdrantModule,
    NotionModule,
    KBModule,
  ],
})
class TestModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(TestModule);
  const kb = app.get(KBService);

  console.log('Testing createArticle() (Notion + Qdrant)...');
  const article = await kb.createArticle({
    title: '[KB SMOKE TEST] Data Sync Delay',
    category: 'Sync',
    symptoms: 'Dashboard shows stale data from several hours ago.',
    rootCause: 'Background sync job is delayed due to rate limiting.',
    resolution: '1. Check rate limit status in admin panel. 2. Wait for backlog to clear. 3. Manually trigger sync if urgent.',
    triggerPhrases: ['stale data', 'old data', 'sync delay', 'not updating'],
    frequency: 1,
    lastSeen: new Date().toISOString().split('T')[0],
    relatedGithubIssues: '',
    status: 'Active',
  });
  console.log(`  Created: "${article.title}" (id: ${article.id})`);

  console.log('\nTesting search()...');
  const matches = await kb.search('my dashboard data looks outdated and stale');
  console.log(`  Found ${matches.length} matches`);
  if (matches.length > 0) {
    console.log(`  Top match: "${matches[0].article.title}" (score: ${matches[0].similarityScore.toFixed(4)})`);
  }

  const found = matches.some((m) => m.article.id === article.id);
  console.log(`  Smoke test article in results: ${found}`);

  console.log('\nTesting bumpFrequency()...');
  await kb.bumpFrequency(article.id, article.frequency);
  const updated = await kb.getArticle(article.id);
  console.log(`  Frequency: ${updated.frequency} (expected 2)`);

  const passed = found && updated.frequency === 2;
  console.log(`\n${passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('\nNote: Clean up the smoke test article from Notion manually.');

  await app.close();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
