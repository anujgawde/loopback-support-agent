import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KBService } from '../kb/kb.service';
import { SupportLogService } from '../support-log/support-log.service';

export interface DashboardStats {
  articles: number;
  resolutions: number;
  hitRate: number;
  agentOnline: boolean;
  pendingTickets: number;
}

export interface AppConfig {
  operatorName: string;
  workspaceName: string;
  companyName: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private kbService: KBService,
    private supportLogService: SupportLogService,
    private configService: ConfigService,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [articles, logs] = await Promise.all([
      this.kbService.getAllArticles(),
      this.supportLogService.getAll(),
    ]);

    const resolutions = logs.filter((l) => l.status === 'Resolved').length;
    const pendingTickets = logs.filter((l) => l.status === 'Pending Review').length;
    const kbHits = logs.filter((l) => l.kbArticleMatched).length;
    const hitRate = logs.length > 0 ? Math.round((kbHits / logs.length) * 100) : 0;

    return {
      articles: articles.length,
      resolutions,
      hitRate,
      agentOnline: true,
      pendingTickets,
    };
  }

  getAppConfig(): AppConfig {
    return {
      operatorName: this.configService.get<string>('app.operatorName') || '',
      workspaceName: this.configService.get<string>('app.workspaceName') || '',
      companyName: this.configService.get<string>('app.companyName') || 'Loopback',
    };
  }
}
