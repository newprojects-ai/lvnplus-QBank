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
    active: number;
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
      console.log('Attempting to connect to LVNPLUS database...');
      
      if (!process.env.LVNPLUS_DB_HOST) {
        throw new Error('LVNPLUS_DB_HOST environment variable is not set');
      }
      
      const env = envSchema.parse(process.env);

      this.lvnplusConnection = await mysql.createConnection({
        host: env.LVNPLUS_DB_HOST,
        user: env.LVNPLUS_DB_USER,
        password: env.LVNPLUS_DB_PASSWORD,
        database: env.LVNPLUS_DB_NAME,
        port: env.LVNPLUS_DB_PORT,
      });

      console.log('Successfully connected to LVNPLUS database');
      
      // Test the connection
      await this.lvnplusConnection.query('SELECT 1');
      console.log('Database connection test successful');
      
    } catch (error) {
      console.error('Failed to connect to LVNPLUS database.');
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
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
      console.error('Connection to LVNPLUS database not established');
      throw new Error('Not connected to LVNPLUS database');
    }

    console.log('Fetching subjects from LVNPLUS...');
    const [subjects] = await this.lvnplusConnection.query(
      'SELECT subject_id, subject_name, description FROM subjects'
    );
    console.log(`Found ${(subjects as any[]).length} subjects`);

    console.log('Fetching topics from LVNPLUS...');
    const [topics] = await this.lvnplusConnection.query(
      'SELECT topic_id, subject_id, topic_name, description FROM topics'
    );
    console.log(`Found ${(topics as any[]).length} topics`);

    console.log('Fetching subtopics from LVNPLUS...');
    const [subtopics] = await this.lvnplusConnection.query(
      'SELECT subtopic_id, topic_id, subtopic_name, description FROM subtopics'
    );
    console.log(`Found ${(subtopics as any[]).length} subtopics`);

    console.log('Fetching difficulty levels from LVNPLUS...');
    const [difficultyLevels] = await this.lvnplusConnection.query(
      'SELECT level_id, level_name, level_value, subject_id, purpose, characteristics, focus_area, steps_required, active FROM difficulty_levels'
    );
    console.log(`Found ${(difficultyLevels as any[]).length} difficulty levels`);

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
      console.log('Fetching data from LVNPLUS...');
      
      const lvnplusData = await this.fetchLVNPLUSData();

      // Start a transaction
      console.log('Starting database transaction...');
      await this.qbankPrisma.$transaction(async (tx) => {
        // Sync subjects
        console.log('Syncing subjects...');
        for (const subject of lvnplusData.subjects) {
          await tx.subjects.upsert({
            where: { subject_id: subject.subject_id },
            create: subject,
            update: subject,
          });
        }
        console.log(`Synced ${lvnplusData.subjects.length} subjects`);

        // Sync topics
        console.log('Syncing topics...');
        for (const topic of lvnplusData.topics) {
          await tx.topics.upsert({
            where: { topic_id: topic.topic_id },
            create: topic,
            update: topic,
          });
        }
        console.log(`Synced ${lvnplusData.topics.length} topics`);

        // Sync subtopics
        console.log('Syncing subtopics...');
        for (const subtopic of lvnplusData.subtopics) {
          await tx.subtopics.upsert({
            where: { subtopic_id: subtopic.subtopic_id },
            create: subtopic,
            update: subtopic,
          });
        }
        console.log(`Synced ${lvnplusData.subtopics.length} subtopics`);

        // Sync difficulty levels
        console.log('Syncing difficulty levels...');
        for (const level of lvnplusData.difficultyLevels) {
          const normalizedLevel = {
            ...level,
            active: Boolean(level.active), // Convert 1/0 to true/false
          };
          
          await tx.difficulty_levels.upsert({
            where: { level_id: level.level_id },
            create: normalizedLevel,
            update: normalizedLevel,
          });
        }
        console.log(`Synced ${lvnplusData.difficultyLevels.length} difficulty levels`);
      });

      console.log('Master data synchronization completed successfully');
    } catch (error) {
      console.error('Failed to sync master data. Error details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }
}