import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from './middleware';

const prisma = new PrismaClient();

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  subject_name: z.string().min(1),
  topic_name: z.string().min(1),
  subtopic_name: z.string().min(1),
  difficulty_level: z.number().min(0).max(5),
  question_format: z.string().min(1),
  options_format: z.string(),
  solution_format: z.string().min(1),
  example_question: z.string().optional(),
});

export async function getTemplates(_req: Request, res: Response) {
  try {
    const templates = await prisma.templates.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

export async function createTemplate(req: AuthRequest, res: Response) {
  try {
    const data = templateSchema.parse(req.body);
    const template = await prisma.templates.create({
      data: {
        ...data,
        created_by: req.user!.userId,
      },
    });
    res.json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(400).json({ error: 'Invalid template data' });
  }
}

export async function updateTemplate(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = templateSchema.parse(req.body);
    
    const template = await prisma.templates.update({
      where: { id },
      data,
    });
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(400).json({ error: 'Failed to update template' });
  }
}

export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.templates.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(400).json({ error: 'Failed to delete template' });
  }
}