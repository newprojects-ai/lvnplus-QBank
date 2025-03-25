import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { MockAIClient, DeepSeekConfig, AIResponse, TokenUsage } from '../types';

export class DeepSeekAPI implements MockAIClient {
  constructor(private apiKey: string) {}

  chat = {
    complete: async (config: DeepSeekConfig) => {
      const result = await this.mockResponse(config.messages, config.role);
      return {
        output: result.response,
        usage: result.usage,
      };
    }
  };

  async mockResponse(messages: ChatCompletionMessageParam[], role?: string): Promise<AIResponse> {
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return {
        success: false,
        error: 'Invalid message content'
      };
    }
    
    // Calculate mock token usage
    const promptTokens = Math.ceil(messages.reduce((acc, msg) => 
      acc + (msg.content?.length || 0) / 4, 0));

    let response: string;
    let completionTokens: number;

    if (role) {
      response = `[Role: ${role}] ${this.generateResponse(lastMessage.content)}`;
    } else {
      response = this.generateResponse(lastMessage.content);
    }
    
    completionTokens = Math.ceil(response.length / 4);

    const usage: TokenUsage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    };

    return {
      success: true,
      response,
      usage
    };
  }

  private generateResponse(prompt: string): string {
    if (prompt.includes('Test successful')) {
      return 'Test successful!';
    }

    return `Here's a question about the requested topic:
    
What is the main concept being tested?

A) First option - This is correct
B) Second option
C) Third option
D) Fourth option

The correct answer is A because it demonstrates the core concept being tested.`
  }
}