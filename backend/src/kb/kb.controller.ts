import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { KBService } from './kb.service';
import { KBArticle } from '../common/types';

@Controller('kb')
export class KBController {
  constructor(private kbService: KBService) {}

  @Get('articles')
  async listArticles() {
    return this.kbService.getAllArticles();
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    return this.kbService.getArticle(id);
  }

  @Post('articles')
  async createArticle(@Body() draft: Omit<KBArticle, 'id' | 'notionUrl'>) {
    return this.kbService.createArticle(draft);
  }

  @Patch('articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() updates: Partial<KBArticle>,
  ) {
    await this.kbService.updateArticle(id, updates);
    return { success: true };
  }

  @Post('search')
  async search(@Body('query') query: string) {
    return this.kbService.search(query);
  }

  @Post('sync')
  async sync() {
    return this.kbService.sync();
  }
}
