import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface AIClient {
  chat: {
    complete: (config: DeepSeekConfig) => Promise<{
      output: string;
      usage?: TokenUsage;
    }>;
  };
  mockResponse?: (messages: ChatCompletionMessageParam[], role?: string) => Promise<AIResponse>;
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