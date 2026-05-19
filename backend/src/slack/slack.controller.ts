import { Controller, Logger } from '@nestjs/common';
import { Message } from 'nestjs-slack-bolt';
import { AgentService } from '../agent/agent.service';
import { SlackService } from './slack.service';

@Controller()
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(
    private agentService: AgentService,
    private slackService: SlackService,
  ) {}

  @Message('')
  async handleMessage({ message, client }: any) {
    if (message.bot_id || message.subtype) return;

    const text = message.text || '';
    if (!text.trim()) return;

    const channelId = message.channel;
    const threadTs = message.thread_ts || message.ts;

    try {
      const result = await this.agentService.processMessage(text, 'Slack', {
        channelId,
        userId: message.user,
        threadTs,
      });

      const blocks = this.slackService.formatAgentResponse(result);
      const fallbackText = result.response || 'Agent processed your message.';

      await client.chat.postMessage({
        channel: channelId,
        blocks,
        text: fallbackText,
        thread_ts: threadTs,
      });

      if (result.bugReport?.githubUrl && result.bugReport?.issueNumber) {
        const issueBlocks = this.slackService.formatGitHubIssueNotification(
          result.bugReport.githubUrl,
          result.bugReport.issueNumber,
          result.bugReport.title || 'Bug Report',
        );
        await client.chat.postMessage({
          channel: channelId,
          blocks: issueBlocks,
          text: `Bug report filed: ${result.bugReport.githubUrl}`,
          thread_ts: threadTs,
        });
      }
    } catch (error) {
      this.logger.error(`Slack message handling failed: ${error.message}`, error.stack);
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: 'Sorry, I encountered an error processing your message. Our team has been notified.',
          thread_ts: threadTs,
        });
      } catch (replyError) {
        this.logger.error(`Failed to send error reply: ${replyError.message}`);
      }
    }
  }
}
