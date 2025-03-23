import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const exportSchema = z.object({
  questionIds: z.array(z.string().uuid()),
  batchId: z.string().uuid().optional(),
});

export async function exportQuestions(req: Request, res: Response) {
  try {
    const { questionIds, batchId } = exportSchema.parse(req.body);

    const exportLog = await prisma.export_logs.create({
      data: {
        batch_id: batchId,
        question_ids: JSON.stringify(questionIds),
        status: 'pending',
      },
    });

    // Start async export process
    processExport(exportLog.id).catch(console.error);

    res.json({ exportId: exportLog.id });
  } catch (error) {
    console.error('Export error:', error);
    res.status(400).json({ error: 'Invalid export request' });
  }
}

async function processExport(exportId: string) {
  try {
    const exportLog = await prisma.export_logs.findUnique({
      where: { id: exportId },
    });

    if (!exportLog) throw new Error('Export log not found');

    const questionIds = JSON.parse(exportLog.question_ids);
    
    // Mark questions as exported
    await prisma.generated_questions.updateMany({
      where: { id: { in: questionIds } },
      data: { export_status: 'exported' },
    });

    await prisma.export_logs.update({
      where: { id: exportId },
      data: { 
        status: 'completed',
        export_time: new Date(),
      },
    });
  } catch (error) {
    console.error('Export processing error:', error);
    await prisma.export_logs.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}