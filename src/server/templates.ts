import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from './middleware';

const prisma = new PrismaClient();

const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  variable_type_id: z.string(),
  is_required: z.boolean(),
  default_value: z.string().optional(),
  validation_rules: z.string().optional(),
  options: z.string().optional(),
  sort_order: z.number(),
});

const promptTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  template_text: z.string().min(1),
  variables: z.array(variableSchema),
});

export async function getPromptTemplates(_req: Request, res: Response) {
  try {
    const templates = await prisma.prompt_templates.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('Get prompt templates error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt templates' });
  }
}

export async function createPromptTemplate(req: AuthRequest, res: Response) {
  try {
    const data = promptTemplateSchema.parse(req.body);
    
    const template = await prisma.prompt_templates.create({
      data: {
        name: data.name,
        description: data.description,
        template_text: data.template_text,
        variables: JSON.stringify(data.variables),
        created_by: req.user!.userId,
      },
    });

    // Create template variables
    for (const variable of data.variables) {
      await prisma.template_variables.create({
        data: {
          ...variable,
          template_id: template.id,
        },
      });
    }

    res.json(template);
  } catch (error) {
    console.error('Create prompt template error:', error);
    res.status(400).json({ error: 'Invalid template data' });
  }
}

export async function updatePromptTemplate(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = promptTemplateSchema.parse(req.body);
    
    const template = await prisma.prompt_templates.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        template_text: data.template_text,
        variables: JSON.stringify(data.variables),
      },
    });

    // Update template variables
    await prisma.template_variables.deleteMany({
      where: { template_id: id },
    });

    for (const variable of data.variables) {
      await prisma.template_variables.create({
        data: {
          ...variable,
          template_id: template.id,
        },
      });
    }

    res.json(template);
  } catch (error) {
    console.error('Update prompt template error:', error);
    res.status(400).json({ error: 'Failed to update template' });
  }
}

export async function deletePromptTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Delete associated variables first
    await prisma.template_variables.deleteMany({
      where: { template_id: id },
    });

    await prisma.prompt_templates.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete prompt template error:', error);
    res.status(400).json({ error: 'Failed to delete template' });
  }
}

export async function getVariableTypes(_req: Request, res: Response) {
  try {
    const types = await prisma.variable_types.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (error) {
    console.error('Get variable types error:', error);
    res.status(500).json({ error: 'Failed to fetch variable types' });
  }
}

export async function getVariableOptions(_req: Request, res: Response) {
  try {
    const options = await prisma.variable_options.findMany({
      orderBy: [
        { variable_type_id: 'asc' },
        { sort_order: 'asc' },
      ],
    });
    res.json(options);
  } catch (error) {
    console.error('Get variable options error:', error);
    res.status(500).json({ error: 'Failed to fetch variable options' });
  }
}