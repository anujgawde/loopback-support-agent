export interface LLMFunctionCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface LLMResponse {
  text: string | null;
  functionCalls: LLMFunctionCall[] | null;
}

export interface LLMProvider {
  generateWithTools(
    systemPrompt: string,
    conversationHistory: any[],
    tools: any[],
  ): Promise<LLMResponse>;

  generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T>;
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;

  readonly name: string;
}
