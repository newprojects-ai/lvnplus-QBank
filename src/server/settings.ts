import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DeepSeekAPI } from './ai/deepseek';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AIClient } from './types';

const prisma = new PrismaClient();

const aiConfigSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  model_name: z.string().min(1),
  api_key: z.string().min(1),
  max_tokens: z.number().int().positive(),
  temperature: z.number().min(0).max(1),
  is_default: z.boolean().default(false),
});

const providerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  api_base_url: z.string().optional(),
  active: z.boolean(),
});

const modelSchema = z.object({
  provider_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  max_tokens: z.number().min(1),
  supports_functions: z.boolean(),
  supports_vision: z.boolean(),
  active: z.boolean(),
});

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

export async function createAIConfig(req: Request, res: Response) {
  try {
    const data = aiConfigSchema.parse(req.body);
    console.log('Creating AI config with data:', { ...data, api_key: '[REDACTED]' });
    
    if (data.is_default) {
      await prisma.ai_config.updateMany({
        data: { is_default: false },
      });
    }

    const config = await prisma.ai_config.create({ 
      data: {
        id: uuidv4(), // Generate new UUID
        name: data.name,
        provider: data.provider,
        model_name: data.model_name,
        api_key: data.api_key,
        max_tokens: data.max_tokens,
        temperature: data.temperature,
        is_default: data.is_default
      }
    });

    console.log('AI config created successfully:', { id: config.id, name: config.name });
    res.json(config);
  } catch (error) {
    console.error('Create AI config error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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
      model: config.model_name,
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

export async function getAIProviders(_req: Request, res: Response) {
  try {
    const providers = await prisma.ai_providers.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(providers);
  } catch (error) {
    console.error('Get AI providers error:', error);
    res.status(500).json({ error: 'Failed to fetch AI providers' });
  }
}

export async function createAIProvider(req: Request, res: Response) {
  try {
    const data = providerSchema.parse(req.body);
    const id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const provider = await prisma.ai_providers.create({
      data: {
        id,
        ...data,
      },
    });
    res.json(provider);
  } catch (error) {
    console.error('Create AI provider error:', error);
    res.status(400).json({ error: 'Failed to create provider' });
  }
}

export async function updateAIProvider(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = providerSchema.parse(req.body);
    
    const provider = await prisma.ai_providers.update({
      where: { id },
      data,
    });
    res.json(provider);
  } catch (error) {
    console.error('Update AI provider error:', error);
    res.status(400).json({ error: 'Failed to update provider' });
  }
}

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

export async function createAIModel(req: Request, res: Response) {
  try {
    const data = modelSchema.parse(req.body);
    const id = `${data.provider_id}-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    const model = await prisma.ai_models.create({
      data: {
        id,
        ...data,
      },
    });
    res.json(model);
  } catch (error) {
    console.error('Create AI model error:', error);
    res.status(400).json({ error: 'Failed to create model' });
  }
}

export async function updateAIModel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = modelSchema.parse(req.body);
    
    const model = await prisma.ai_models.update({
      where: { id },
      data,
    });
    res.json(model);
  } catch (error) {
    console.error('Update AI model error:', error);
    res.status(400).json({ error: 'Failed to update model' });
  }
}