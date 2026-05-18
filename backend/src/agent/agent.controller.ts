import { Body, Controller, Post } from '@nestjs/common';
import { AgentService, AgentResult } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post('process')
  async process(
    @Body() body: { message: string },
  ): Promise<AgentResult> {
    return this.agentService.processMessage(body.message, 'Web');
  }
}
