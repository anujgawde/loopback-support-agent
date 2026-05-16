import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotionModule } from '../notion/notion.module';
import { NotionService } from '../notion/notion.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotionModule],
})
class TestModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(TestModule);
  const notion = app.get(NotionService);

  console.log('Testing createKBArticle()...');
  const article = await notion.createKBArticle({
    title: '[SMOKE TEST] GitHub Integration Issue',
    category: 'Integration',
    symptoms: 'Dashboard shows no data after connecting GitHub org.',
    rootCause: 'GitHub App webhook not delivering events.',
    resolution: '1. Check GitHub App installation. 2. Verify webhook URL. 3. Re-install if needed.',
    triggerPhrases: ['no data', 'empty dashboard', 'github connected but nothing'],
    frequency: 1,
    lastSeen: new Date().toISOString().split('T')[0],
    relatedGithubIssues: '',
    status: 'Active',
  });
  console.log(`  Created article: "${article.title}" (id: ${article.id})`);
  console.log(`  Notion URL: ${article.notionUrl}`);

  console.log('\nTesting getArticle()...');
  const fetched = await notion.getArticle(article.id);
  console.log(`  Retrieved: "${fetched.title}"`);
  console.log(`  Category: ${fetched.category}`);
  console.log(`  Trigger phrases: [${fetched.triggerPhrases.join(', ')}]`);

  console.log('\nTesting updateKBArticle()...');
  await notion.updateKBArticle(article.id, { frequency: 5 });
  const updated = await notion.getArticle(article.id);
  console.log(`  Frequency after update: ${updated.frequency} (expected 5)`);

  console.log('\nTesting getAllArticles()...');
  const all = await notion.getAllArticles();
  console.log(`  Total articles in DB: ${all.length}`);

  const passed =
    fetched.title === article.title &&
    fetched.category === 'Integration' &&
    updated.frequency === 5;
  console.log(`\n${passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('\nNote: Clean up the smoke test article manually from Notion.');

  await app.close();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
