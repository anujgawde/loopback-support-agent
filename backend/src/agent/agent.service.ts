import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { KBService } from '../kb/kb.service';
import { GitHubService } from '../github/github.service';
import { SupportLogService } from '../support-log/support-log.service';
import { BugReport } from '../common/types';
import { AGENT_TOOLS } from './tools/tool-definitions';
import { getAgentSystemPrompt } from './prompts/agent-system.prompt';
import { buildDraftResponsePrompt } from './prompts/draft-response.prompt';
import { buildBugReportPrompt } from './prompts/generate-bug-report.prompt';

export interface ToolCallLog {
  tool: string;
  args: Record<string, any>;
  result: any;
  timestamp: Date;
}

export interface AgentResult {
  response: string | null;
  toolCalls: ToolCallLog[];
  logId: string;
  classification?: {
    category: string;
    severity: string;
    symptomSummary?: string;
  };
  decision?: {
    action: string;
    confidence: number;
    reasoning: string;
  };
  kbMatches?: { id: string; title: string; score: number; frequency: number }[];
  bugReport?: any;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly MAX_ITERATIONS = 10;

  constructor(
    private llmService: LLMService,
    private kbService: KBService,
    private githubService: GitHubService,
    private supportLogService: SupportLogService,
  ) {}

  async processMessage(
    message: string,
    source: 'Slack' | 'Web',
    metadata?: { channelId?: string; userId?: string },
  ): Promise<AgentResult> {
    const systemPrompt = getAgentSystemPrompt();
    const conversationHistory: any[] = [
      { role: 'user', parts: [{ text: message }] },
    ];

    const toolResults: ToolCallLog[] = [];
    let finalResponse: string | null = null;
    let iterations = 0;

    while (!finalResponse && iterations < this.MAX_ITERATIONS) {
      iterations++;

      const llmResponse = await this.llmService.generateWithTools(
        systemPrompt,
        conversationHistory,
        AGENT_TOOLS,
      );

      if (llmResponse.functionCalls && llmResponse.functionCalls.length > 0) {
        conversationHistory.push({ role: 'model', parts: llmResponse.rawParts || llmResponse.functionCalls.map((call) => ({
          functionCall: { name: call.name, args: call.args },
        })) });

        const responseParts: any[] = [];
        for (const call of llmResponse.functionCalls) {
          this.logger.log(`Tool call: ${call.name}`);
          const result = await this.executeTool(call.name, call.args);

          toolResults.push({
            tool: call.name,
            args: call.args,
            result,
            timestamp: new Date(),
          });

          responseParts.push({
            functionResponse: {
              name: call.name,
              response: typeof result === 'object' && !Array.isArray(result)
                ? result
                : { data: result },
            },
          });
        }
        conversationHistory.push({ role: 'user', parts: responseParts });
      }

      if (llmResponse.text) {
        finalResponse = llmResponse.text;
        if (!llmResponse.functionCalls) {
          conversationHistory.push({
            role: 'model',
            parts: [{ text: llmResponse.text }],
          });
        }
      }
    }

    if (!finalResponse) {
      finalResponse = 'Agent reached maximum iterations without a final response.';
    }

    const kbSearchResult = toolResults.find((t) => t.tool === 'search_kb');
    const kbResults = Array.isArray(kbSearchResult?.result) ? kbSearchResult.result : [];
    const topMatch = kbResults[0];
    const topConfidence = topMatch?.similarityScore || 0;
    const topArticleTitle = topMatch?.article?.title || '';

    const kbMatchData = topMatch ? {
      id: topMatch.article?.id || '',
      title: topMatch.article?.title || '',
      score: topMatch.similarityScore || 0,
      frequency: topMatch.article?.frequency || 0,
    } : null;

    const kbMatches = kbResults.map((m: any) => ({
      id: m.article?.id || '',
      title: m.article?.title || '',
      score: m.similarityScore || 0,
      frequency: m.article?.frequency || 0,
    }));

    const bugReportResult = toolResults.find((t) => t.tool === 'generate_bug_report');
    const bugReport = bugReportResult?.result || null;

    let bugFiled = toolResults.some((t) => t.tool === 'create_github_issue');
    let githubResult = toolResults.find((t) => t.tool === 'create_github_issue')?.result;

    if (bugReport && !bugFiled) {
      this.logger.log('Bug report generated without GitHub issue — auto-filing');
      githubResult = await this.githubService.createIssue(
        bugReport.title || 'Bug Report',
        bugReport.markdownBody || bugReport.description || '',
        bugReport.suggestedLabels || ['bug'],
      );
      bugFiled = true;
      toolResults.push({
        tool: 'create_github_issue',
        args: { title: bugReport.title },
        result: githubResult,
        timestamp: new Date(),
      });
    }

    const githubUrl = githubResult?.url || '';
    const githubIssueNumber = githubResult?.number || null;

    let decision: string;
    if (bugFiled || bugReport) {
      decision = 'GENERATE_BUG_REPORT';
    } else if (topConfidence >= 0.7) {
      decision = 'RESPOND_FROM_KB';
    } else if (topConfidence >= 0.55) {
      decision = 'SUGGEST_KB_MATCH';
    } else {
      decision = 'NEW_ISSUE_TRACK';
    }

    let category = 'Other';
    let severity = 'medium';
    if (bugReport) {
      category = 'Sync';
      severity = bugReport.severity || 'medium';
    } else if (topMatch?.article?.category) {
      category = topMatch.article.category;
    }

    if (bugReport && bugReport.environment && typeof bugReport.environment === 'object') {
      const env = bugReport.environment;
      bugReport.environment = [
        env.plan && `plan: ${env.plan}`,
        env.teamSize && `team: ${env.teamSize}`,
        env.integrations && `integrations: ${Array.isArray(env.integrations) ? env.integrations.join(', ') : env.integrations}`,
        env.relevantConfig && env.relevantConfig,
      ].filter(Boolean).join(' · ');
    }

    if (bugReport && githubIssueNumber) {
      bugReport.issueNumber = githubIssueNumber;
      bugReport.githubUrl = githubUrl;
    }

    const logEntry = await this.supportLogService.create({
      timestamp: new Date().toISOString(),
      customerMessage: message,
      source,
      agentResponse: finalResponse,
      toolCalls: toolResults,
      kbArticleMatched: topArticleTitle,
      confidence: topConfidence,
      category,
      severity,
      decision,
      kbMatch: kbMatchData,
      bugReport,
      bugReportFiled: bugFiled,
      githubIssueUrl: githubUrl,
      githubIssueNumber,
      slackChannelId: metadata?.channelId,
      slackUserId: metadata?.userId,
      status: 'Pending Review',
    });

    return {
      response: finalResponse,
      toolCalls: toolResults,
      logId: logEntry.id,
      classification: { category, severity },
      decision: {
        action: decision,
        confidence: topConfidence,
        reasoning: `Based on ${toolResults.length} tool calls`,
      },
      kbMatches,
      bugReport,
    };
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_kb':
        return this.kbService.search(args.query);

      case 'draft_response': {
        const article = await this.kbService.getArticle(args.kbArticleId);
        const { system, user } = buildDraftResponsePrompt(
          args.customerMessage,
          article,
        );
        const response = await this.llmService.generateText(system, user);
        return { draftResponse: response };
      }

      case 'generate_bug_report': {
        const { system, user } = buildBugReportPrompt(
          args.customerMessage,
          args.category,
          args.severity,
        );
        const bugReport = await this.llmService.generateJSON<BugReport>(
          system,
          user,
        );
        return bugReport;
      }

      case 'create_github_issue':
        return this.githubService.createIssue(
          args.title,
          args.body,
          args.labels,
        );

      case 'create_kb_article':
        return this.kbService.createArticle({
          title: args.title,
          category: args.category,
          symptoms: args.symptoms,
          rootCause: args.rootCause,
          resolution: args.resolution,
          triggerPhrases: args.triggerPhrases,
          frequency: 1,
          lastSeen: new Date().toISOString().split('T')[0],
          relatedGithubIssues: '',
          status: 'Active',
        });

      case 'update_kb_article': {
        const updates: any = {};
        if (args.frequencyBump) {
          const current = await this.kbService.getArticle(args.articleId);
          updates.frequency = current.frequency + 1;
          updates.lastSeen = new Date().toISOString().split('T')[0];
        }
        if (args.newTriggerPhrases) {
          const current = await this.kbService.getArticle(args.articleId);
          updates.triggerPhrases = [
            ...current.triggerPhrases,
            ...args.newTriggerPhrases,
          ];
        }
        if (args.updatedResolution) {
          updates.resolution = args.updatedResolution;
        }
        await this.kbService.updateArticle(args.articleId, updates);
        return { updated: true, articleId: args.articleId };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }
}
