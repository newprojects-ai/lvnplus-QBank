import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './middleware';

const prisma = new PrismaClient();

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string(),
  color: z.string(),
  sort_order: z.number().optional(),
});

const variableSchema = z.object({
  category_id: z.string(),
  name: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  variable_type_id: z.string(),
  default_value: z.string().optional(),
  validation_rules: z.string().optional(),
  options: z.string().optional(),
  is_required: z.boolean().default(true),
  sort_order: z.number().optional(),
});

export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.variable_categories.findMany({
      orderBy: { sort_order: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function createCategory(req: AuthRequest, res: Response) {
  try {
    const data = categorySchema.parse(req.body);
    const id = uuidv4();

    const category = await prisma.variable_categories.create({
      data: {
        id,
        ...data,
        created_by: req.user!.userId,
      },
    });
    res.json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(400).json({ error: 'Invalid category data' });
  }
}

export async function updateCategory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = categorySchema.parse(req.body);
    const category = await prisma.variable_categories.update({
      where: { id },
      data,
    });
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(400).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Delete all variables in this category first
    await prisma.variable_definitions.deleteMany({
      where: { category_id: id }
    });
    
    await prisma.variable_categories.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(400).json({ error: 'Failed to delete category' });
  }
}

export async function getVariablesByCategory(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    const variables = await prisma.variable_definitions.findMany({
      where: { category_id: categoryId },
      orderBy: { sort_order: 'asc' },
      include: {
        category: true,
        variable_type: true,
      },
    });
    res.json(variables);
  } catch (error) {
    console.error('Get variables error:', error);
    res.status(500).json({ error: 'Failed to fetch variables' });
  }
}

export async function createVariable(req: AuthRequest, res: Response) {
  try {
    const data = variableSchema.parse(req.body);
    const id = uuidv4();

    const variable = await prisma.variable_definitions.create({
      data: {
        id,
        ...data,
        created_by: req.user!.userId,
      },
    });
    res.json(variable);
  } catch (error) {
    console.error('Create variable error:', error);
    res.status(400).json({ error: 'Invalid variable data' });
  }
}

export async function updateVariable(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = variableSchema.parse(req.body);
    const variable = await prisma.variable_definitions.update({
      where: { id },
      data,
    });
    res.json(variable);
  } catch (error) {
    console.error('Update variable error:', error);
    res.status(400).json({ error: 'Failed to update variable' });
  }
}

export async function deleteVariable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Delete any template usage first
    await prisma.template_variable_usage.deleteMany({
      where: { variable_id: id }
    });
    
    await prisma.variable_definitions.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete variable error:', error);
    res.status(400).json({ error: 'Failed to delete variable' });
  }
}

export async function getTemplateVariables(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const variables = await prisma.template_variable_usage.findMany({
      where: { template_id: templateId },
      include: {
        variable: {
          include: {
            category: true,
            variable_type: true,
          },
        },
      },
      orderBy: { sort_order: 'asc' },
    });
    res.json(variables);
  } catch (error) {
    console.error('Get template variables error:', error);
    res.status(500).json({ error: 'Failed to fetch template variables' });
  }
}

export async function updateTemplateVariables(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const { variableIds } = req.body;

    // Delete existing usage
    await prisma.template_variable_usage.deleteMany({
      where: { template_id: templateId },
    });

    // Create new usage records
    const usage = await Promise.all(
      variableIds.map((variableId: string, index: number) =>
        prisma.template_variable_usage.create({
          data: {
            template_id: templateId,
            variable_id: variableId,
            sort_order: index,
          },
        })
      )
    );

    res.json(usage);
  } catch (error) {
    console.error('Update template variables error:', error);
    res.status(400).json({ error: 'Failed to update template variables' });
  }
}