import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import OpenAI from 'openai';
import axios from 'axios';

const prisma = new PrismaClient();

// OpenAI configuration - only initialize if API key is available
let openai: OpenAI | undefined;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OPENAI_API_KEY not found in environment variables. OpenAI functionality will be disabled.');
}

// Get all tasks
export async function getTasks(_req: Request, res: Response) {
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
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

// Get a task by ID
export async function getTaskById(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const task = await prisma.tasks.findUnique({
      where: { id },
      include: {
        prompt_template: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
}

// Create a new task
export async function createTask(req: Request, res: Response) {
  const { template_id, variable_values } = req.body;
  
  try {
    // Validate template exists
    const template = await prisma.prompt_templates.findUnique({
      where: { id: template_id },
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Validate task variables
    const variableValues = JSON.parse(variable_values);
    const validation = validateTaskVariables(variableValues);
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    // Create the task
    const task = await prisma.tasks.create({
      data: {
        template_id,
        variable_values,
        status: 'pending',
      },
      include: {
        prompt_template: true,
      },
    });
    
    // Process the task asynchronously
    processTaskAsync(task.id).catch(error => {
      console.error(`Error processing task ${task.id}:`, error);
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

// Delete a task
export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    await prisma.tasks.delete({
      where: { id },
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

// Process a task asynchronously
async function processTaskAsync(taskId: string) {
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
    
    // Update task status to processing
    await prisma.tasks.update({
      where: { id: taskId },
      data: { status: 'processing' },
    });
    
    // Parse the variable values
    const variableValues = JSON.parse(task.variable_values);
    
    // Process the template with the variables
    let processedTemplate = task.prompt_template.template_text;
    
    // Replace variables in the template
    for (const [key, value] of Object.entries(variableValues)) {
      const placeholder = `{${key}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'openai';
    
    if (aiProvider === 'openai') {
      // Check if OpenAI is configured
      if (!openai) {
        throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
      }
      
      // Use OpenAI
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an educational content generator.' },
          { role: 'user', content: processedTemplate }
        ],
        temperature: 0.7,
      });
      
      // Update task with the result - just mark as completed
      await prisma.tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });
      
      console.log(`Task ${taskId} completed with response: ${aiResponse.choices[0].message.content}`);
    } else if (aiProvider === 'deepseek') {
      // Check if DeepSeek API key is configured
      if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key not configured. Please add DEEPSEEK_API_KEY to your environment variables.');
      }
      
      // Use DeepSeek API
      const deepseekResponse = await axios.post(
        process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an educational content generator.' },
            { role: 'user', content: processedTemplate }
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
        }
      );
      
      // Update task with the result - just mark as completed
      await prisma.tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });
      
      console.log(`Task ${taskId} completed with response: ${deepseekResponse.data.choices[0].message.content}`);
    } else {
      throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }
  } catch (error) {
    console.error('Error processing task:', error);
    
    // Update task with error
    await prisma.tasks.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

// Helper function to validate the specific variables we need
export function validateTaskVariables(variableValues: any) {
  const requiredVariables = ['topic', 'subtopic', 'total_questions'];
  const missingVariables = requiredVariables.filter(v => !variableValues[v]);
  
  if (missingVariables.length > 0) {
    return {
      valid: false,
      message: `Missing required variables: ${missingVariables.join(', ')}`
    };
  }
  
  // Validate total_questions is a number
  if (typeof variableValues.total_questions !== 'number') {
    return {
      valid: false,
      message: 'total_questions must be a number'
    };
  }
  
  // Validate difficulty_distribution is an object if provided
  if (variableValues.difficulty_distribution && 
      typeof variableValues.difficulty_distribution !== 'object') {
    return {
      valid: false,
      message: 'difficulty_distribution must be an object'
    };
  }
  
  // Validate katex_style is one of the allowed values if provided
  if (variableValues.katex_style && 
      !['minimal', 'standard', 'detailed'].includes(variableValues.katex_style)) {
    return {
      valid: false,
      message: 'katex_style must be one of: minimal, standard, detailed'
    };
  }
  
  return { valid: true };
}
