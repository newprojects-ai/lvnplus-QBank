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
  max_length?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  system_prompt?: string;
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
  finish_reason?: string;
}