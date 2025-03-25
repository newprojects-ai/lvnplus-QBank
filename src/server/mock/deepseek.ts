import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { MockAIClient, DeepSeekConfig } from '../types';

export class DeepSeekAPI implements MockAIClient {
  constructor(private apiKey: string) {}

  chat = {
    complete: async (config: DeepSeekConfig) => {
      const response = await this.mockResponse(config.messages);
      return {
        output: response,
      };
    }
  };

  async mockResponse(messages: ChatCompletionMessageParam[]): Promise<string> {
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      throw new Error('Invalid message content');
    }
    
    // Generate a mock response based on the input
    if (lastMessage.content.includes('Test successful!')) {
      return 'Test successful!';
    }
    
    // For question generation, create a structured response
    return `Here's a question about the requested topic:
    
What is the main concept being tested?

A) First option - This is correct
B) Second option
C) Third option
D) Fourth option

The correct answer is A because it demonstrates the core concept being tested.`;
  }
}