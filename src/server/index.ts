import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';

// Load environment variables
dotenv.config();

import { login } from './auth';
import { authenticate } from './middleware';
import {
  getSubjects,
  getTopics,
  getSubtopics,
  getDifficultyLevels,
} from './routes/masterData';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from './templates';
import { generateQuestions } from './generator';
import {
  approveQuestion,
  updateQuestion,
  deleteQuestion,
} from './questions';
import { getDashboardStats } from './dashboard';
import { exportQuestions } from './export';
import {
  getAIConfigs,
  createAIConfig,
  updateAIConfig,
  deleteAIConfig,
  testAIConfig
} from './settings';

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Database connection check
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to MariaDB');
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit, just log the error
    console.error('Please ensure MariaDB is running and credentials are correct');
  }
}

// Auth routes
app.post('/api/auth/login', login);

// Protected routes
app.use('/api', authenticate);

// Master Data routes
app.get('/api/master-data/subjects', getSubjects);
app.get('/api/master-data/topics/:subjectId', getTopics);
app.get('/api/master-data/subtopics/:topicId', getSubtopics);
app.get('/api/master-data/difficulty-levels/:subjectId', getDifficultyLevels);

// Templates
app.get('/api/templates', getTemplates);
app.post('/api/templates', createTemplate);
app.put('/api/templates/:id', updateTemplate);
app.delete('/api/templates/:id', deleteTemplate);

// Questions
app.post('/api/generate', generateQuestions);
app.post('/api/questions/:id/approve', approveQuestion);
app.put('/api/questions/:id', updateQuestion);
app.delete('/api/questions/:id', deleteQuestion);

// Dashboard
app.get('/api/dashboard/stats', getDashboardStats);

// Export
app.post('/api/export', exportQuestions);

// Settings
app.get('/api/settings/ai', getAIConfigs);
app.post('/api/settings/ai', createAIConfig);
app.put('/api/settings/ai/:id', updateAIConfig);
app.delete('/api/settings/ai/:id', deleteAIConfig);
app.get('/api/settings/models', getAIModels);
app.post('/api/settings/ai/:id/test', testAIConfig);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`Server running on port ${PORT}`);
});