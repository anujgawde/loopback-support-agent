import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMResponse, LLMFunctionCall } from '../llm-provider.interface';
import { randomUUID } from 'crypto';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateWithTools(
    systemPrompt: string,
    conversationHistory: any[],
    tools: any[],
  ): Promise<LLMResponse> {
    const response = await this.callWithRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: conversationHistory,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: tools }],
        },
      }),
    );

    const candidate = response.candidates?.[0];
    const parts = (candidate?.content as any)?.parts || [];

    const functionCalls: LLMFunctionCall[] = [];
    let text: string | null = null;

    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push({
          id: (part.functionCall as any).id || randomUUID(),
          name: part.functionCall.name!,
          args: part.functionCall.args as Record<string, any>,
        });
      }
      if (part.text) {
        text = part.text;
      }
    }

    return {
      text: text || null,
      functionCalls: functionCalls.length > 0 ? functionCalls : null,
      rawParts: parts,
    };
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const response = await this.callWithRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      }),
    );
    const raw = (response.text || '{}').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}') as T;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.callWithRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      }),
    );
    return response.text || '';
  }

  private async callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (err?.status === 429 && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw err;
      }
    }
    throw new Error('GeminiProvider: max retries exceeded');
  }
}
