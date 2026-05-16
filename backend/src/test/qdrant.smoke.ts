import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingModule } from '../embedding/embedding.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { QdrantService } from '../qdrant/qdrant.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmbeddingModule, QdrantModule],
})
class TestModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(TestModule);
  const qdrant = app.get(QdrantService);
  const embedding = app.get(EmbeddingService);

  const testId = 'smoke-test-' + Date.now();

  console.log('Testing upsert()...');
  const vector = await embedding.embed('GitHub integration not showing data');
  await qdrant.upsert(testId, vector, { title: 'Smoke Test Article' });
  console.log(`  Upserted vector with id: ${testId}`);

  console.log('\nTesting search()...');
  const queryVector = await embedding.embed('GitHub data not appearing');
  const results = await qdrant.search(queryVector, 5, 0.3);
  console.log(`  Found ${results.length} results`);
  const found = results.find((r) => r.id === testId);
  console.log(`  Test vector found: ${!!found} (score: ${found?.score?.toFixed(4) || 'N/A'})`);

  console.log('\nTesting delete()...');
  await qdrant.delete(testId);
  console.log('  Deleted test vector');

  const afterDelete = await qdrant.search(queryVector, 5, 0.3);
  const stillFound = afterDelete.find((r) => r.id === testId);
  console.log(`  Verified deletion: ${!stillFound}`);

  const passed = !!found && !stillFound;
  console.log(`\n${passed ? '✓ PASSED' : '✗ FAILED'}`);

  await app.close();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
