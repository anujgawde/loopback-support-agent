import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';
import { KBArticle } from '../common/types';

@Injectable()
export class NotionService {
  private notion: Client;
  private databaseId: string;
  private readonly logger = new Logger(NotionService.name);

  constructor(private configService: ConfigService) {
    this.notion = new Client({
      auth: this.configService.get<string>('NOTION_API_KEY'),
    });
    this.databaseId = this.configService.get<string>('NOTION_KB_DATABASE_ID') || '';
  }

  async createKBArticle(
    draft: Omit<KBArticle, 'id' | 'notionUrl'>,
  ): Promise<KBArticle> {
    const response = await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Title: { title: [{ text: { content: draft.title } }] },
        Category: { select: { name: draft.category } },
        Symptoms: {
          rich_text: this.splitRichText(draft.symptoms),
        },
        'Root Cause': {
          rich_text: this.splitRichText(draft.rootCause),
        },
        Resolution: {
          rich_text: this.splitRichText(draft.resolution),
        },
        'Trigger Phrases': {
          rich_text: [{ text: { content: draft.triggerPhrases.join(', ') } }],
        },
        Frequency: { number: draft.frequency || 1 },
        'Last Seen': {
          date: {
            start: draft.lastSeen || new Date().toISOString().split('T')[0],
          },
        },
        'Related GitHub Issues': {
          url: draft.relatedGithubIssues || null,
        },
        Status: { select: { name: draft.status || 'Active' } },
      },
    });

    return this.pageToArticle(response);
  }

  async updateKBArticle(
    pageId: string,
    updates: Partial<KBArticle>,
  ): Promise<void> {
    const properties: any = {};

    if (updates.title !== undefined)
      properties['Title'] = {
        title: [{ text: { content: updates.title } }],
      };
    if (updates.category !== undefined)
      properties['Category'] = { select: { name: updates.category } };
    if (updates.symptoms !== undefined)
      properties['Symptoms'] = {
        rich_text: this.splitRichText(updates.symptoms),
      };
    if (updates.rootCause !== undefined)
      properties['Root Cause'] = {
        rich_text: this.splitRichText(updates.rootCause),
      };
    if (updates.resolution !== undefined)
      properties['Resolution'] = {
        rich_text: this.splitRichText(updates.resolution),
      };
    if (updates.triggerPhrases !== undefined)
      properties['Trigger Phrases'] = {
        rich_text: [{ text: { content: updates.triggerPhrases.join(', ') } }],
      };
    if (updates.frequency !== undefined)
      properties['Frequency'] = { number: updates.frequency };
    if (updates.lastSeen !== undefined)
      properties['Last Seen'] = { date: { start: updates.lastSeen } };
    if (updates.relatedGithubIssues !== undefined)
      properties['Related GitHub Issues'] = {
        url: updates.relatedGithubIssues || null,
      };
    if (updates.status !== undefined)
      properties['Status'] = { select: { name: updates.status } };

    await this.notion.pages.update({ page_id: pageId, properties });
  }

  async getArticle(pageId: string): Promise<KBArticle> {
    const page = await this.notion.pages.retrieve({ page_id: pageId });
    return this.pageToArticle(page);
  }

  async getAllArticles(): Promise<KBArticle[]> {
    const articles: KBArticle[] = [];
    let cursor: string | undefined;

    do {
      const response: any = await this.notion.databases.query({
        database_id: this.databaseId,
        start_cursor: cursor,
        page_size: 100,
      });
      articles.push(
        ...response.results.map((page: any) => this.pageToArticle(page)),
      );
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return articles;
  }

  private pageToArticle(page: any): KBArticle {
    const props = page.properties;
    return {
      id: page.id,
      title: props['Title']?.title?.[0]?.text?.content || '',
      category: props['Category']?.select?.name || 'Other',
      symptoms: this.extractRichText(props['Symptoms']),
      rootCause: this.extractRichText(props['Root Cause']),
      resolution: this.extractRichText(props['Resolution']),
      triggerPhrases: this.extractRichText(props['Trigger Phrases'])
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      frequency: props['Frequency']?.number || 0,
      lastSeen: props['Last Seen']?.date?.start || '',
      relatedGithubIssues: props['Related GitHub Issues']?.url || '',
      status: props['Status']?.select?.name || 'Active',
      notionUrl: page.url,
    };
  }

  private extractRichText(prop: any): string {
    return (
      prop?.rich_text?.map((t: any) => t.text?.content || '').join('') || ''
    );
  }

  private splitRichText(
    text: string,
  ): { text: { content: string } }[] {
    if (!text) return [{ text: { content: '' } }];
    const chunks: { text: { content: string } }[] = [];
    for (let i = 0; i < text.length; i += 2000) {
      chunks.push({ text: { content: text.slice(i, i + 2000) } });
    }
    return chunks;
  }
}
