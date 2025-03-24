import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface MockAIClient {
  mockResponse: (messages: ChatCompletionMessageParam[]) => Promise<string>;
}

export interface DeepSeekConfig {
  model: string;
  temperature: number;
  messages: ChatCompletionMessageParam[];
}