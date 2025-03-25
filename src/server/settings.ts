import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { DeepSeekAPI } from './ai/deepseek';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AIClient } from './types';

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

export async function getAIModels(_req: Request, res: Response) {
  try {
    const models = await prisma.ai_models.findMany({
      where: { active: true },
      include: {
        provider: true
      },
      orderBy: [
        { provider_id: 'asc' },
        { name: 'asc' }
      ],
    });
    res.json(models);
  } catch (error) {
    console.error('Get AI models error:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
}

export async function getAIConfigs(_req: Request, res: Response) {
  try {
    const configs = await prisma.ai_config.findMany({
      include: {
        model: {
          include: {
            provider: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(configs);
  } catch (error) {
    console.error('Get AI configs error:', error);
    res.status(500).json({ error: 'Failed to fetch AI configurations' });
  }
}

export async function getAIModels(_req: Request, res: Response) {
  try {
    const models = await prisma.ai_models.findMany({
      where: { active: true },
      include: { provider: true },
      orderBy: [
        { provider_id: 'asc' },
        { name: 'asc' }
      ],
    });
    res.json(models);
  } catch (error) {
    console.error('Get AI models error:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
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

    let ai: AIClient;
    ai = new DeepSeekAPI(config.api_key);

    const messages = [
      { 
        role: 'user' as const, 
        content: req.body.prompt || 'Test message'
      } satisfies ChatCompletionMessageParam
    ] satisfies ChatCompletionMessageParam[];

    if (req.body.system_prompt) {
      messages.unshift({
        role: 'system' as const,
        content: req.body.system_prompt
      });
    }

    const result = await ai.chat.complete({
      model: config.model,
      temperature: req.body.temperature || config.temperature,
      max_length: req.body.max_length || config.max_length,
      top_p: req.body.top_p || config.top_p,
      top_k: req.body.top_k || config.top_k,
      frequency_penalty: req.body.frequency_penalty || config.frequency_penalty,
      presence_penalty: req.body.presence_penalty || config.presence_penalty,
      stop_sequences: req.body.stop_sequences || JSON.parse(config.stop_sequences || '[]'),
      role: req.body.role,
      messages,
    });

    res.json({
      success: true,
      response: result.output,
      request: result.request,
      usage: result.usage,
      finish_reason: result.finish_reason
    });
  } catch (error) {
    console.error('Test AI config error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test configuration' 
    });
  }
}