import { Body, Controller, Post } from '@nestjs/common';
import { GitHubService } from './github.service';

@Controller('github')
export class GitHubController {
  constructor(private githubService: GitHubService) {}

  @Post('issues')
  async createIssue(
    @Body() body: { title: string; body: string; labels?: string[] },
  ): Promise<{ url: string; number: number }> {
    return this.githubService.createIssue(
      body.title,
      body.body,
      body.labels || ['bug'],
    );
  }
}
