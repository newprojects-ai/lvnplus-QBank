import axios from 'axios';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AIClient, DeepSeekConfig, AIResponse } from '../types';

export class DeepSeekAPI implements AIClient {
  constructor(private apiKey: string) {}

  chat = {
    complete: async (config: DeepSeekConfig) => {
      try {
        if (!['deepseek-chat', 'deepseek-coder'].includes(config.model)) {
          throw new Error('Invalid DeepSeek model name');
        }

        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          {
            model: config.model,
            messages: config.messages,
            temperature: config.temperature,
            role: config.role,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return {
          output: response.data.choices[0].message.content,
          usage: response.data.usage,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.error?.message || error.message);
        }
        throw error;
      }
    }
  };

  async mockResponse(messages: ChatCompletionMessageParam[], role?: string): Promise<AIResponse> {
    const result = await this.chat.complete({ messages, role, model: 'deepseek-chat', temperature: 0.7 });
    return {
      success: true,
      response: result.output,
      usage: result.usage
    };
  }
}