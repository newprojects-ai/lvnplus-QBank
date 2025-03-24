import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';
import { AuthRequest } from './middleware.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const prisma = new PrismaClient();

const generateSchema = z.object({
  templateId: z.string().uuid(),
  count: z.number().min(1).max(50),
  difficultyLevel: z.number().min(0).max(5),
  temperature: z.number().min(0).max(1),
});

export async function generateQuestions(req: AuthRequest, res: Response) {
  try {
    const { templateId, count, difficultyLevel, temperature } = generateSchema.parse(req.body);

    const template = await prisma.templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const batch = await prisma.generation_batches.create({
      data: {
        template_id: templateId,
        count,
        difficulty_level: difficultyLevel,
        status: 'pending',
        ai_temperature: temperature,
      },
    });

    // Start async generation process
    generateQuestionsAsync(batch.id, template, req.user!.userId).catch(console.error);

    res.json({ batchId: batch.id });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(400).json({ error: 'Invalid generation request' });
  }
}

async function generateQuestionsAsync(batchId: string, template: any, userId: string) {
  try {
    const aiConfig = await prisma.ai_config.findFirst({
      where: { is_default: true },
    });

    if (!aiConfig) {
      throw new Error('No AI configuration found');
    }

    let ai;
    if (aiConfig.provider === 'openai') {
      ai = new OpenAI({ apiKey: aiConfig.api_key });
    } else {
      // Mock DeepSeek implementation until API is available
      ai = {
        mockResponse: async (messages: ChatCompletionMessageParam[]) => {
          // Simulate API response
          return `Generated question based on: ${messages[messages.length - 1].content}\n\n` +
                 `Option A: First option\nOption B: Second option\n\n` +
                 `Detailed solution here`;
        }
      };
    }

    const batch = await prisma.generation_batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    for (let i = 0; i < batch.count; i++) {
      try {
        const messages = [
          {
            role: 'system' as const,
            content: `You are a question generator for ${template.subject_name}. 
                       Generate a question following this format:
                       ${template.question_format}
                       
                       The options should follow this format:
                       ${template.options_format}
                       
                       The solution should follow this format:
                       ${template.solution_format}`,
          },
          {
            role: 'user' as const,
            content: `Generate a ${template.subject_name} question about ${template.topic_name}, 
                       specifically about ${template.subtopic_name}, 
                       at difficulty level ${batch.difficulty_level}/5.`,
          },
        ] satisfies ChatCompletionMessageParam[];

        let response;
        if (aiConfig.provider === 'openai') {
          const completion = await ai.chat.completions.create({
            model: batch.ai_model,
            temperature: batch.ai_temperature,
            messages,
          });
          response = completion.choices[0]?.message?.content;
        } else {
          response = await ai.mockResponse(messages);
        }

        if (!response) continue;

        const [question, options, solution] = response.split('\n\n');

        await prisma.generated_questions.create({
          data: {
            batch_id: batchId,
            subject_name: template.subject_name,
            topic_name: template.topic_name,
            subtopic_name: template.subtopic_name,
            question_text: question,
            question_text_plain: question,
            options: JSON.stringify(options.split('\n')),
            options_plain: JSON.stringify(options.split('\n')),
            correct_answer: options.split('\n')[0],
            correct_answer_plain: options.split('\n')[0],
            solution,
            solution_plain: solution,
            difficulty_level: batch.difficulty_level,
            created_by: userId,
            status: 'pending',
          },
        });
      } catch (error) {
        console.error('Question generation error:', error);
      }
    }

    await prisma.generation_batches.update({
      where: { id: batchId },
      data: { status: 'completed', completed_at: new Date() },
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    await prisma.generation_batches.update({
      where: { id: batchId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date(),
      },
    });
  }
}