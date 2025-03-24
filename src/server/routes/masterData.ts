/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: LVNPLUS master data endpoints
 *
 * /api/master-data/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 * 
 * /api/master-data/topics/{subjectId}:
 *   get:
 *     summary: Get topics for a subject
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 * 
 * /api/master-data/subtopics/{topicId}:
 *   get:
 *     summary: Get subtopics for a topic
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of subtopics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subtopic'
 * 
 * /api/master-data/difficulty-levels/{subjectId}:
 *   get:
 *     summary: Get difficulty levels for a subject
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of difficulty levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DifficultyLevel'
 * 
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       properties:
 *         subject_id:
 *           type: integer
 *         subject_name:
 *           type: string
 *         description:
 *           type: string
 *     Topic:
 *       type: object
 *       properties:
 *         topic_id:
 *           type: integer
 *         subject_id:
 *           type: integer
 *         topic_name:
 *           type: string
 *         description:
 *           type: string
 *     Subtopic:
 *       type: object
 *       properties:
 *         subtopic_id:
 *           type: integer
 *         topic_id:
 *           type: integer
 *         subtopic_name:
 *           type: string
 *         description:
 *           type: string
 *     DifficultyLevel:
 *       type: object
 *       properties:
 *         level_id:
 *           type: integer
 *         level_name:
 *           type: string
 *         level_value:
 *           type: integer
 *         subject_id:
 *           type: integer
 *         purpose:
 *           type: string
 *         characteristics:
 *           type: string
 *         focus_area:
 *           type: string
 *         steps_required:
 *           type: string
 *         active:
 *           type: boolean
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSubjects(_req: Request, res: Response) {
  try {
    console.log('Processing getSubjects request...');

    const subjects = await prisma.subjects.findMany({
      where: { description: { not: null } },
      orderBy: { subject_name: 'asc' },
    });

    console.log(`Found ${subjects.length} subjects:`, subjects);

    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
}

export async function getTopics(req: Request, res: Response) {
  try {
    const { subjectId } = req.params;
    const topics = await prisma.topics.findMany({
      where: { 
        subject_id: parseInt(subjectId),
        description: { not: null }
      },
      orderBy: { topic_name: 'asc' },
    });
    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
}

export async function getSubtopics(req: Request, res: Response) {
  try {
    const { topicId } = req.params;
    const subtopics = await prisma.subtopics.findMany({
      where: { 
        topic_id: parseInt(topicId),
        description: { not: null }
      },
      orderBy: { subtopic_name: 'asc' },
    });
    res.json(subtopics);
  } catch (error) {
    console.error('Get subtopics error:', error);
    res.status(500).json({ error: 'Failed to fetch subtopics' });
  }
}

export async function getDifficultyLevels(req: Request, res: Response) {
  try {
    const { subjectId } = req.params;
    const levels = await prisma.difficulty_levels.findMany({
      where: { 
        subject_id: parseInt(subjectId),
        active: true
      },
      orderBy: { level_value: 'asc' },
    });
    res.json(levels);
  } catch (error) {
    console.error('Get difficulty levels error:', error);
    res.status(500).json({ error: 'Failed to fetch difficulty levels' });
  }
}