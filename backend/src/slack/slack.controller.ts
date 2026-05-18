import { Controller } from '@nestjs/common';
import { Message } from 'nestjs-slack-bolt';
import { AgentService, AgentResult } from '../agent/agent.service';

@Controller()
export class SlackController {
  constructor(private agentService: AgentService) {}

  @Message('')
  async handleMessage({ message, client }: any) {
    if (message.bot_id || message.subtype) return;

    const text = message.text || '';
    if (!text.trim()) return;

    const result = await this.agentService.processMessage(text, 'Slack', {
      channelId: message.channel,
      userId: message.user,
    });

    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.ts,
      text: this.formatSlackResponse(result),
    });
  }

  private formatSlackResponse(result: AgentResult): string {
    const toolNames = result.toolCalls.map((t) => t.tool).join(' → ');
    let response = `🔧 *Agent path:* ${toolNames}\n\n`;
    response += result.response || '';
    return response;
  }
}
