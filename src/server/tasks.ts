import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { OpenAI } from 'openai';
import { DeepSeekAPI } from './ai/deepseek';
import { AuthRequest } from './middleware';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AIClient as AIClientType } from './types';

type AIClient = OpenAI | AIClientType;

function isOpenAI(client: AIClient): client is OpenAI {
  return client instanceof OpenAI;
}

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  template_id: z.string().uuid(),
  variable_values: z.string(), // JSON string of variables
});

/**
 * Get all tasks
 */
export async function getTasks(_req: AuthRequest, res: Response) {
  try {
    const tasks = await prisma.tasks.findMany({
      include: {
        prompt_template: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

/**
 * Get a specific task by ID
 */
export async function getTask(req: AuthRequest, res: Response) {
  try {
    const taskId = req.params.id;
    
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        prompt_template: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
}

/**
 * Create a new task
 */
export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { template_id, variable_values } = createTaskSchema.parse(req.body);
    
    // Verify that the template exists
    const template = await prisma.prompt_templates.findUnique({
      where: { id: template_id },
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Create the task
    const task = await prisma.tasks.create({
      data: {
        template_id,
        variable_values,
        status: 'pending',
      },
    });
    
    // Process task asynchronously
    processTaskAsync(task.id, req.user?.userId).catch(console.error);
    
    res.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid task data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
}

/**
 * Delete a task
 */
export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const taskId = req.params.id;
    
    // Check if task exists
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Delete the task
    await prisma.tasks.delete({
      where: { id: taskId },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

/**
 * Process a task asynchronously
 */
async function processTaskAsync(taskId: string, _userId?: string) {
  try {
    // Get the task with its template
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: {
        prompt_template: true,
      },
    });
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    // Get the default AI configuration
    const aiConfig = await prisma.ai_config.findFirst({
      where: { is_default: true },
    });
    
    if (!aiConfig) {
      throw new Error('No AI configuration found');
    }
    
    // Initialize the AI client based on the provider
    let ai: AIClient;
    if (aiConfig.provider === 'openai') {
      ai = new OpenAI({ apiKey: aiConfig.api_key });
    } else {
      ai = new DeepSeekAPI(aiConfig.api_key);
    }
    
    // Parse the template variables and values
    const variableValues = JSON.parse(task.variable_values);
    
    // Process the template with the variables
    let processedTemplate = task.prompt_template.template_text;
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(variableValues)) {
      const placeholder = `{{${key}}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    // Prepare messages for AI
    const messages = [
      {
        role: 'system' as const,
        content: aiConfig.system_prompt || 'You are a helpful assistant.',
      },
      {
        role: 'user' as const,
        content: processedTemplate,
      },
    ] satisfies ChatCompletionMessageParam[];
    
    // Get response from AI
    let response;
    if (aiConfig.provider === 'openai') {
      if (!isOpenAI(ai)) throw new Error('Invalid OpenAI configuration');
      
      const completion = await ai.chat.completions.create({
        model: aiConfig.model_name,
        temperature: aiConfig.temperature || 0.7,
        max_tokens: aiConfig.max_tokens || 1000,
        messages,
      });
      
      response = completion.choices[0]?.message?.content;
    } else {
      const nonOpenAI = ai as AIClientType;
      if (typeof nonOpenAI.mockResponse === 'function') {
        const result = await nonOpenAI.mockResponse(messages);
        response = result.response;
      } else {
        throw new Error('Invalid AI client configuration');
      }
    }
    
    if (!response) {
      throw new Error('No response from AI');
    }
    
    // Update task with success
    await prisma.tasks.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completed_at: new Date(),
      },
    });
    
  } catch (error) {
    console.error('Task processing error:', error);
    
    // Update task with error
    await prisma.tasks.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date(),
      },
    });
  }
}
