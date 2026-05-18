import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, LLMResponse } from './llm-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class LLMService implements LLMProvider {
  private provider: LLMProvider;

  constructor(private configService: ConfigService) {
    const providerName = this.configService.get('llm.provider') || 'gemini';
    switch (providerName) {
      case 'gemini':
      default:
        this.provider = new GeminiProvider(
          this.configService.get<string>('llm.geminiApiKey') || '',
        );
    }
  }

  async generateWithTools(
    systemPrompt: string,
    conversationHistory: any[],
    tools: any[],
  ): Promise<LLMResponse> {
    return this.provider.generateWithTools(systemPrompt, conversationHistory, tools);
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    return this.provider.generateJSON<T>(systemPrompt, userPrompt);
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.provider.generateText(systemPrompt, userPrompt);
  }

  get name() {
    return this.provider.name;
  }
}
