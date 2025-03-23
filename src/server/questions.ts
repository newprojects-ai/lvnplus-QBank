import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const questionUpdateSchema = z.object({
  question_text: z.string(),
  question_text_plain: z.string(),
  options: z.string(),
  options_plain: z.string(),
  correct_answer: z.string(),
  correct_answer_plain: z.string(),
  solution: z.string(),
  solution_plain: z.string(),
});

export async function approveQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const question = await prisma.generated_questions.update({
      where: { id },
      data: { status: 'approved' },
    });
    res.json(question);
  } catch (error) {
    console.error('Approve question error:', error);
    res.status(400).json({ error: 'Failed to approve question' });
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = questionUpdateSchema.parse(req.body);
    
    const question = await prisma.generated_questions.update({
      where: { id },
      data,
    });
    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(400).json({ error: 'Failed to update question' });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.generated_questions.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(400).json({ error: 'Failed to delete question' });
  }
}