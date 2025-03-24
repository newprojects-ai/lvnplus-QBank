import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [totalQuestions, approvedQuestions, pendingQuestions, failedBatches] =
      await Promise.all([
        prisma.generated_questions.count(),
        prisma.generated_questions.count({
          where: { status: 'approved' },
        }),
        prisma.generated_questions.count({
          where: { status: 'pending' },
        }),
        prisma.generation_batches.count({
          where: { status: 'failed' },
        }),
      ]);

    res.json({
      totalQuestions,
      approvedQuestions,
      pendingQuestions,
      failedQuestions: failedBatches,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}