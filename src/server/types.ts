import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface MockAIClient {
  mockResponse: (messages: ChatCompletionMessageParam[]) => Promise<string>;
}

export interface DeepSeekConfig {
  model: string;
  temperature: number;
  role?: string;
  messages: ChatCompletionMessageParam[];
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: TokenUsage;
}