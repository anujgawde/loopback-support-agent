import { Body, Controller, Post } from '@nestjs/common';
import { AgentService, AgentResult } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post('process')
  async process(
    @Body() body: { message: string; ticketId?: string },
  ): Promise<AgentResult> {
    return this.agentService.processMessage(body.message, 'Web', {
      existingTicketId: body.ticketId || undefined,
    });
  }

  @Post('regenerate-draft')
  async regenerateDraft(
    @Body()
    body: {
      customerMessage: string;
      resolution: string;
      rootCause?: string;
      logId?: string;
    },
  ): Promise<{ draftResponse: string }> {
    return this.agentService.regenerateDraft(
      body.customerMessage,
      body.resolution,
      body.rootCause,
      body.logId,
    );
  }
}
