import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { EmbeddingService } from '../embedding/embedding.service';

@Module({ imports: [EmbeddingModule] })
class TestModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(TestModule);
  const embedding = app.get(EmbeddingService);

  console.log('Testing embed()...');
  const vector = await embedding.embed('GitHub integration not working');
  console.log(`  Vector length: ${vector.length} (expected 384)`);
  console.log(`  First 5 values: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  console.log(`  L2 norm: ${norm.toFixed(4)} (expected ~1.0)`);

  console.log('\nTesting buildEmbeddableText()...');
  const text = embedding.buildEmbeddableText({
    title: 'Test Article',
    symptoms: 'Dashboard shows no data',
    triggerPhrases: ['no data', 'empty dashboard'],
    rootCause: 'Webhook not configured',
  });
  console.log(`  Built text: "${text}"`);

  const passed = vector.length === 384 && Math.abs(norm - 1.0) < 0.01;
  console.log(`\n${passed ? '✓ PASSED' : '✗ FAILED'}`);

  await app.close();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
