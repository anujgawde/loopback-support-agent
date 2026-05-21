import { Injectable, Logger } from "@nestjs/common";
import { WebClient } from "@slack/web-api";
import { ConfigService } from "@nestjs/config";
import { AgentResult } from "../agent/agent.service";

@Injectable()
export class SlackService {
  private client: WebClient;
  private readonly logger = new Logger(SlackService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>("slack.botToken");
    this.client = new WebClient(token || undefined);
    if (!token) {
      this.logger.warn(
        "SLACK_BOT_TOKEN not configured. Slack messaging disabled",
      );
    }
  }

  async postMessage(
    channel: string,
    text: string,
    threadTs?: string,
  ): Promise<void> {
    if (!this.client.token) return;
    try {
      await this.client.chat.postMessage({
        channel,
        text,
        thread_ts: threadTs,
        unfurl_links: false,
      });
    } catch (error) {
      this.logger.error(
        `Failed to post message to ${channel}: ${error.message}`,
      );
      throw error;
    }
  }

  async postBlocksMessage(
    channel: string,
    blocks: any[],
    text: string,
    threadTs?: string,
  ): Promise<void> {
    if (!this.client.token) return;
    try {
      await this.client.chat.postMessage({
        channel,
        blocks,
        text,
        thread_ts: threadTs,
        unfurl_links: false,
      });
    } catch (error) {
      this.logger.error(
        `Failed to post blocks to ${channel}: ${error.message}`,
      );
      throw error;
    }
  }

  formatAgentResponse(result: AgentResult): any[] {
    const blocks: any[] = [];

    const toolNames = result.toolCalls.map((t) => t.tool).join(" → ");
    if (toolNames) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `*Agent path:* ${toolNames}` }],
      });
      blocks.push({ type: "divider" });
    }

    if (result.response) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: result.response },
      });
    }

    if (result.bugReport?.githubUrl) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:bug: *Bug report filed:* <${result.bugReport.githubUrl}|GitHub Issue #${result.bugReport.issueNumber}>`,
        },
      });
    }

    if (result.kbMatches && result.kbMatches.length > 0) {
      const topMatch = result.kbMatches[0];
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `KB match: "${topMatch.title}" (${Math.round(topMatch.score * 100)}% confidence)`,
          },
        ],
      });
    }

    return blocks;
  }

  formatGitHubIssueNotification(
    issueUrl: string,
    issueNumber: number,
    title: string,
  ): any[] {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:bug: *Bug report filed as GitHub Issue*\n<${issueUrl}|#${issueNumber}: ${title}>`,
        },
      },
    ];
  }
}
