import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';

export interface ConversationTurn {
  role: 'customer' | 'agent';
  message: string;
  timestamp: string;
}

export interface SupportLogEntry {
  id: string;
  title: string;
  timestamp: string;
  customerMessage: string;
  customerName: string;
  customerOrg: string;
  source: 'Slack' | 'Web';
  slackChannel: string;
  category: string;
  severity: string;
  decision: string;
  confidence: number | null;
  toolsUsed: string[];
  agentResponse: string | null;
  kbArticleMatched: string;
  kbMatch: { id: string; title: string; score: number; frequency: number } | null;
  bugReport: any | null;
  bugReportFiled: boolean;
  githubIssueUrl: string;
  githubIssueNumber: number | null;
  kbArticleCreated: boolean;
  slackThreadTs: string;
  conversationHistory: ConversationTurn[];
  status: 'Pending Review' | 'Sent' | 'Resolved' | 'Dismissed';
}

export interface CreateSupportLogInput {
  timestamp: string;
  customerMessage: string;
  customerName?: string;
  customerOrg?: string;
  source: 'Slack' | 'Web';
  agentResponse: string | null;
  toolCalls: { tool: string }[];
  kbArticleMatched?: string;
  confidence?: number;
  category?: string;
  severity?: string;
  decision?: string;
  kbMatch?: { id: string; title: string; score: number; frequency: number } | null;
  bugReport?: any | null;
  bugReportFiled?: boolean;
  githubIssueUrl?: string;
  githubIssueNumber?: number | null;
  slackChannelId?: string;
  slackUserId?: string;
  slackThreadTs?: string;
  status: string;
}

@Injectable()
export class SupportLogService {
  private notion: Client;
  private databaseId: string;
  private readonly logger = new Logger(SupportLogService.name);

  constructor(private configService: ConfigService) {
    this.notion = new Client({
      auth: this.configService.get<string>('NOTION_API_KEY'),
    });
    this.databaseId =
      this.configService.get<string>('NOTION_SUPPORT_LOG_DATABASE_ID') || '';
  }

  async create(input: CreateSupportLogInput): Promise<{ id: string }> {
    if (!this.databaseId) {
      this.logger.warn('NOTION_SUPPORT_LOG_DATABASE_ID not configured, skipping log');
      return { id: '' };
    }

    const title = input.customerMessage.slice(0, 50);
    const toolsUsed = input.toolCalls.map((t) => t.tool).join(', ');

    const conversationHistory: ConversationTurn[] = [
      { role: 'customer', message: input.customerMessage, timestamp: input.timestamp },
    ];
    if (input.agentResponse) {
      conversationHistory.push({ role: 'agent', message: input.agentResponse, timestamp: input.timestamp });
    }

    const enrichedData = JSON.stringify({
      customerName: input.customerName || '',
      customerOrg: input.customerOrg || '',
      category: input.category || 'Other',
      severity: input.severity || 'medium',
      decision: input.decision || '',
      kbMatch: input.kbMatch || null,
      bugReport: input.bugReport || null,
      githubIssueNumber: input.githubIssueNumber || null,
      conversationHistory,
    });

    const response = await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Title: { title: [{ text: { content: title } }] },
        Timestamp: { date: { start: input.timestamp } },
        'Customer Message': {
          rich_text: this.splitRichText(input.customerMessage),
        },
        Source: { select: { name: input.source } },
        'Agent Response': {
          rich_text: this.splitRichText(input.agentResponse || ''),
        },
        'Tools Used': { rich_text: [{ text: { content: toolsUsed } }] },
        'KB Article Matched': {
          rich_text: [{ text: { content: input.kbArticleMatched || '' } }],
        },
        Confidence: { number: input.confidence || 0 },
        'Bug Report Filed': { checkbox: input.bugReportFiled || false },
        'KB Article Created': { checkbox: false },
        'GitHub Issue URL': { url: input.githubIssueUrl || null },
        Status: { select: { name: input.status || 'Pending Review' } },
        'Slack Channel': {
          rich_text: [{ text: { content: input.slackChannelId || '' } }],
        },
        'Slack Thread TS': {
          rich_text: [{ text: { content: input.slackThreadTs || '' } }],
        },
        'Enriched Data': {
          rich_text: this.splitRichText(enrichedData),
        },
      },
    });

    return { id: response.id };
  }

  async getAll(): Promise<SupportLogEntry[]> {
    if (!this.databaseId) return [];

    const entries: SupportLogEntry[] = [];
    let cursor: string | undefined;

    do {
      const response: any = await this.notion.databases.query({
        database_id: this.databaseId,
        start_cursor: cursor,
        page_size: 50,
        sorts: [{ property: 'Timestamp', direction: 'descending' }],
      });
      entries.push(
        ...response.results.map((page: any) => this.pageToEntry(page)),
      );
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    return entries;
  }

  async getById(id: string): Promise<SupportLogEntry> {
    const page = await this.notion.pages.retrieve({ page_id: id });
    return this.pageToEntry(page);
  }

  async updateStatus(
    id: string,
    status: 'Pending Review' | 'Sent' | 'Resolved' | 'Dismissed',
  ): Promise<SupportLogEntry> {
    const valid = ['Pending Review', 'Sent', 'Resolved', 'Dismissed'];
    if (!valid.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    await this.notion.pages.update({
      page_id: id,
      properties: {
        Status: { select: { name: status } },
      },
    });
    return this.getById(id);
  }

  async findByThreadTs(threadTs: string): Promise<SupportLogEntry | null> {
    if (!this.databaseId || !threadTs) return null;

    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Slack Thread TS',
        rich_text: { equals: threadTs },
      },
      page_size: 1,
    });

    if (response.results.length === 0) return null;
    return this.pageToEntry(response.results[0]);
  }

  async appendFollowUp(
    pageId: string,
    newCustomerMessage: string,
    newAgentResponse: string | null,
    toolCalls: { tool: string }[],
    existingEntry: SupportLogEntry,
  ): Promise<SupportLogEntry> {
    const history = [...(existingEntry.conversationHistory || [])];
    history.push({ role: 'customer', message: newCustomerMessage, timestamp: new Date().toISOString() });
    if (newAgentResponse) {
      history.push({ role: 'agent', message: newAgentResponse, timestamp: new Date().toISOString() });
    }

    let existingEnriched: any = {};
    try {
      const page: any = await this.notion.pages.retrieve({ page_id: pageId });
      const enrichedStr = this.extractRichText(page.properties['Enriched Data']);
      if (enrichedStr) existingEnriched = JSON.parse(enrichedStr);
    } catch {}

    const updatedEnriched = { ...existingEnriched, conversationHistory: history };

    const newTools = toolCalls.map((t) => t.tool);
    const allTools = [...existingEntry.toolsUsed, ...newTools].join(', ');

    await this.notion.pages.update({
      page_id: pageId,
      properties: {
        'Agent Response': { rich_text: this.splitRichText(newAgentResponse || '') },
        'Tools Used': { rich_text: [{ text: { content: allTools } }] },
        'Enriched Data': { rich_text: this.splitRichText(JSON.stringify(updatedEnriched)) },
        Status: { select: { name: 'Pending Review' } },
      },
    });

    return this.getById(pageId);
  }

  async updateAgentResponse(id: string, agentResponse: string): Promise<SupportLogEntry> {
    await this.notion.pages.update({
      page_id: id,
      properties: {
        'Agent Response': {
          rich_text: this.splitRichText(agentResponse),
        },
      },
    });
    return this.getById(id);
  }

  async markKbArticleCreated(id: string): Promise<SupportLogEntry> {
    await this.notion.pages.update({
      page_id: id,
      properties: {
        'KB Article Created': { checkbox: true },
      },
    });
    return this.getById(id);
  }

  private pageToEntry(page: any): SupportLogEntry {
    const props = page.properties;
    const toolsUsedStr = this.extractRichText(props['Tools Used']);
    const toolsUsed = toolsUsedStr ? toolsUsedStr.split(', ').filter(Boolean) : [];

    let enriched: any = {};
    try {
      const enrichedStr = this.extractRichText(props['Enriched Data']);
      if (enrichedStr) enriched = JSON.parse(enrichedStr);
    } catch {}

    const githubIssueUrl = props['GitHub Issue URL']?.url || '';
    let githubIssueNumber = enriched.githubIssueNumber || null;
    if (!githubIssueNumber && githubIssueUrl) {
      const match = githubIssueUrl.match(/\/(\d+)$/);
      if (match) githubIssueNumber = parseInt(match[1], 10);
    }

    return {
      id: page.id,
      title: props['Title']?.title?.[0]?.text?.content || '',
      timestamp: props['Timestamp']?.date?.start || '',
      customerMessage: this.extractRichText(props['Customer Message']),
      customerName: enriched.customerName || '',
      customerOrg: enriched.customerOrg || '',
      source: props['Source']?.select?.name || 'Web',
      slackChannel: this.extractRichText(props['Slack Channel']),
      category: enriched.category || 'Other',
      severity: enriched.severity || 'medium',
      decision: enriched.decision || '',
      confidence: props['Confidence']?.number || null,
      toolsUsed,
      agentResponse: this.extractRichText(props['Agent Response']) || null,
      kbArticleMatched: this.extractRichText(props['KB Article Matched']),
      kbMatch: enriched.kbMatch || null,
      bugReport: enriched.bugReport || null,
      bugReportFiled: props['Bug Report Filed']?.checkbox || false,
      kbArticleCreated: props['KB Article Created']?.checkbox || false,
      slackThreadTs: this.extractRichText(props['Slack Thread TS']),
      conversationHistory: enriched.conversationHistory || [],
      githubIssueUrl,
      githubIssueNumber,
      status: props['Status']?.select?.name || 'Pending Review',
    };
  }

  private extractRichText(prop: any): string {
    return (
      prop?.rich_text?.map((t: any) => t.text?.content || '').join('') || ''
    );
  }

  private splitRichText(text: string): { text: { content: string } }[] {
    if (!text) return [{ text: { content: '' } }];
    const chunks: { text: { content: string } }[] = [];
    for (let i = 0; i < text.length; i += 2000) {
      chunks.push({ text: { content: text.slice(i, i + 2000) } });
    }
    return chunks;
  }
}
