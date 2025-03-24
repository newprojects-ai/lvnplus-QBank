import { PrismaClient as QBankPrisma } from '@prisma/client';
import mysql from 'mysql2/promise';
import { z } from 'zod';

// Validation schemas
const envSchema = z.object({
  LVNPLUS_DB_HOST: z.string(),
  LVNPLUS_DB_USER: z.string(),
  LVNPLUS_DB_PASSWORD: z.string(),
  LVNPLUS_DB_NAME: z.string(),
  LVNPLUS_DB_PORT: z.string().transform(Number).default('3306'),
});

// Types for LVNPLUS data
interface LVNPLUSData {
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    description: string | null;
  }>;
  topics: Array<{
    topic_id: number;
    subject_id: number;
    topic_name: string;
    description: string | null;
  }>;
  subtopics: Array<{
    subtopic_id: number;
    topic_id: number;
    subtopic_name: string;
    description: string | null;
  }>;
  difficultyLevels: Array<{
    level_id: number;
    level_name: string;
    level_value: number;
    subject_id: number;
    purpose: string;
    characteristics: string;
    focus_area: string;
    steps_required: string | null;
    active: boolean;
  }>;
}

export class MasterDataSync {
  private qbankPrisma: QBankPrisma;
  private lvnplusConnection: mysql.Connection | null = null;

  constructor() {
    this.qbankPrisma = new QBankPrisma();
  }

  async connect() {
    try {
      const env = envSchema.parse(process.env);

      this.lvnplusConnection = await mysql.createConnection({
        host: env.LVNPLUS_DB_HOST,
        user: env.LVNPLUS_DB_USER,
        password: env.LVNPLUS_DB_PASSWORD,
        database: env.LVNPLUS_DB_NAME,
        port: env.LVNPLUS_DB_PORT,
      });

      console.log('Successfully connected to LVNPLUS database');
    } catch (error) {
      console.error('Failed to connect to LVNPLUS database:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.lvnplusConnection) {
      await this.lvnplusConnection.end();
      this.lvnplusConnection = null;
    }
    await this.qbankPrisma.$disconnect();
  }

  private async fetchLVNPLUSData(): Promise<LVNPLUSData> {
    if (!this.lvnplusConnection) {
      throw new Error('Not connected to LVNPLUS database');
    }

    const [subjects] = await this.lvnplusConnection.query(
      'SELECT subject_id, subject_name, description FROM subjects'
    );

    const [topics] = await this.lvnplusConnection.query(
      'SELECT topic_id, subject_id, topic_name, description FROM topics'
    );

    const [subtopics] = await this.lvnplusConnection.query(
      'SELECT subtopic_id, topic_id, subtopic_name, description FROM subtopics'
    );

    const [difficultyLevels] = await this.lvnplusConnection.query(
      'SELECT level_id, level_name, level_value, subject_id, purpose, characteristics, focus_area, steps_required, active FROM difficulty_levels'
    );

    return {
      subjects: subjects as LVNPLUSData['subjects'],
      topics: topics as LVNPLUSData['topics'],
      subtopics: subtopics as LVNPLUSData['subtopics'],
      difficultyLevels: difficultyLevels as LVNPLUSData['difficultyLevels'],
    };
  }

  async syncMasterData() {
    try {
      console.log('Starting master data synchronization...');
      
      const lvnplusData = await this.fetchLVNPLUSData();

      // Start a transaction
      await this.qbankPrisma.$transaction(async (tx) => {
        // Sync subjects
        for (const subject of lvnplusData.subjects) {
          await tx.subjects.upsert({
            where: { subject_id: subject.subject_id },
            create: subject,
            update: subject,
          });
        }

        // Sync topics
        for (const topic of lvnplusData.topics) {
          await tx.topics.upsert({
            where: { topic_id: topic.topic_id },
            create: topic,
            update: topic,
          });
        }

        // Sync subtopics
        for (const subtopic of lvnplusData.subtopics) {
          await tx.subtopics.upsert({
            where: { subtopic_id: subtopic.subtopic_id },
            create: subtopic,
            update: subtopic,
          });
        }

        // Sync difficulty levels
        for (const level of lvnplusData.difficultyLevels) {
          await tx.difficulty_levels.upsert({
            where: { level_id: level.level_id },
            create: level,
            update: level,
          });
        }
      });

      console.log('Master data synchronization completed successfully');
    } catch (error) {
      console.error('Failed to sync master data:', error);
      throw error;
    }
  }
}