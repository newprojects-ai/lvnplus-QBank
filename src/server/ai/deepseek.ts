import axios from 'axios';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AIClient, DeepSeekConfig, AIResponse } from '../types';

export class DeepSeekAPI implements AIClient {
  constructor(private apiKey: string) {}

  chat = {
    complete: async (config: DeepSeekConfig) => {
      try {
        const requestBody = {
          model: config.model,
          messages: config.messages,
          temperature: config.temperature,
          max_tokens: config.max_length,
          top_p: config.top_p,
          top_k: config.top_k,
          frequency_penalty: config.frequency_penalty,
          presence_penalty: config.presence_penalty,
          stop: config.stop_sequences,
          role: config.role,
        };

        const response = await axios.post(
          'https://api.deepseek.com/v1/chat/completions',
          requestBody,
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
          request: requestBody,
          finish_reason: response.data.choices[0].finish_reason
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          const requestData = error.config?.data ? JSON.parse(error.config.data) : null;
          const errorDetails = {
            message: errorMessage,
            request: requestData,
            status: error.response?.status,
            statusText: error.response?.statusText
          };
          console.error('DeepSeek API error:', errorDetails);
          throw new Error(errorMessage);
        }
        throw error;
      }
    }
  };

  async mockResponse(messages: ChatCompletionMessageParam[], role?: string): Promise<AIResponse> {
    const result = await this.chat.complete({
      messages,
      role,
      model: 'deepseek-chat',
      temperature: 0.7,
      max_length: 2048,
      top_p: 0.9,
      top_k: 50,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop_sequences: []
    });

    return {
      success: true,
      response: result.output,
      usage: result.usage,
      request: result.request,
      finish_reason: result.finish_reason
    };
  }
}