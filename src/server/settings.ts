import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const prisma = new PrismaClient();

const aiConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string(),
  model: z.string(),
  api_key: z.string(),
  max_tokens: z.number().min(1),
  temperature: z.number().min(0).max(1),
  is_default: z.boolean(),
});

export async function getAIConfigs(req: Request, res: Response) {
  try {
    const configs = await prisma.ai_config.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(configs);
  } catch (error) {
    console.error('Get AI configs error:', error);
    res.status(500).json({ error: 'Failed to fetch AI configurations' });
  }
}

export async function createAIConfig(req: Request, res: Response) {
  try {
    const data = aiConfigSchema.parse(req.body);
    
    if (data.is_default) {
      await prisma.ai_config.updateMany({
        data: { is_default: false },
      });
    }

    const config = await prisma.ai_config.create({ data });
    res.json(config);
  } catch (error) {
    console.error('Create AI config error:', error);
    res.status(400).json({ error: 'Invalid AI configuration data' });
  }
}

export async function updateAIConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = aiConfigSchema.parse(req.body);

    if (data.is_default) {
      await prisma.ai_config.updateMany({
        where: { NOT: { id } },
        data: { is_default: false },
      });
    }

    const config = await prisma.ai_config.update({
      where: { id },
      data,
    });
    res.json(config);
  } catch (error) {
    console.error('Update AI config error:', error);
    res.status(400).json({ error: 'Failed to update AI configuration' });
  }
}

export async function deleteAIConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.ai_config.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete AI config error:', error);
    res.status(400).json({ error: 'Failed to delete AI configuration' });
  }
}

export async function testAIConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const config = await prisma.ai_config.findUnique({
      where: { id },
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    let ai;
    if (config.provider === 'openai') {
      ai = new OpenAI({ apiKey: config.api_key });
    } else {
      // Mock DeepSeek implementation
      ai = {
        chat: {
          complete: async ({ messages }: { messages: any[] }) => ({
            output: "Test successful!"
          })
        }
      };
    }

    const messages = [
      { 
        role: 'user' as const, 
        content: 'Respond with "Test successful!" if you can read this message.' 
      } satisfies ChatCompletionMessageParam
    ] satisfies ChatCompletionMessageParam[];

    let response;
    if (config.provider === 'openai') {
      const completion = await ai.chat.completions.create({
        model: config.model,
        temperature: config.temperature,
        messages,
      });
      response = completion.choices[0]?.message?.content;
    } else {
      const completion = await ai.chat.complete({
        model: config.model,
        temperature: config.temperature,
        messages,
      });
      response = completion.output;
    }

    res.json({ success: true, response });
  } catch (error) {
    console.error('Test AI config error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test configuration' 
    });
  }
}