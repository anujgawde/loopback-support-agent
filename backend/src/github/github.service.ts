import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private readonly logger = new Logger(GitHubService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.octokit = new Octokit({ auth: token || undefined });
    const repoStr = this.configService.get<string>('GITHUB_REPO') || '/';
    const [owner, repo] = repoStr.split('/');
    this.owner = owner || '';
    this.repo = repo || '';
  }

  async createIssue(
    title: string,
    body: string,
    labels: string[],
  ): Promise<{ url: string; number: number }> {
    if (!this.owner || !this.repo) {
      this.logger.warn('GITHUB_REPO not configured, skipping issue creation');
      return { url: '', number: 0 };
    }

    const response = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
    });

    this.logger.log(`Created GitHub issue #${response.data.number}`);
    return {
      url: response.data.html_url,
      number: response.data.number,
    };
  }
}
