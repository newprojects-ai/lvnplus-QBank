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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getVariablesByCategory,
  createVariable,
  updateVariable,
  deleteVariable,
  getTemplateVariables,
  updateTemplateVariables,
} from './variables';
import {
  getTemplates,
  getTemplateById,
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
  testAIConfig,
  getAIProviders,
  createAIProvider,
  updateAIProvider,
  getAIModels,
  createAIModel,
  updateAIModel
} from './settings';
import {
  getTasks,
  getTaskById,
  createTask,
  deleteTask
} from './tasks';

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
    console.error('Please ensure MariaDB is running and credentials are correct');
  }
}

// Auth routes
app.post('/api/auth/login', login);

// Unprotected template routes (temporary)
app.get('/api/prompt-templates', getTemplates);
app.get('/api/prompt-templates/:id', getTemplateById);
app.post('/api/prompt-templates', createTemplate);
app.put('/api/prompt-templates/:id', updateTemplate);
app.delete('/api/prompt-templates/:id', deleteTemplate);

// Protected routes
app.use('/api', authenticate);

// Master Data routes
app.get('/api/master-data/subjects', getSubjects);
app.get('/api/master-data/topics/:subjectId', getTopics);
app.get('/api/master-data/subtopics/:topicId', getSubtopics);
app.get('/api/master-data/difficulty-levels/:subjectId', getDifficultyLevels);

// Variable Categories
app.get('/api/variable-categories', getCategories);
app.post('/api/variable-categories', createCategory);
app.put('/api/variable-categories/:id', updateCategory);
app.delete('/api/variable-categories/:id', deleteCategory);

// Variable Definitions
app.get('/api/variable-definitions/:categoryId', getVariablesByCategory);
app.post('/api/variable-definitions', createVariable);
app.put('/api/variable-definitions/:id', updateVariable);
app.delete('/api/variable-definitions/:id', deleteVariable);

// Template Variables
app.get('/api/template-variables/:templateId', getTemplateVariables);
app.put('/api/template-variables/:templateId', updateTemplateVariables);

// Questions
app.post('/api/generate', generateQuestions);
app.post('/api/questions/:id/approve', approveQuestion);
app.put('/api/questions/:id', updateQuestion);
app.delete('/api/questions/:id', deleteQuestion);

// Dashboard
app.get('/api/dashboard/stats', getDashboardStats);

// Export
app.post('/api/export', exportQuestions);

// Settings - AI Configurations
app.get('/api/settings/ai', getAIConfigs);
app.post('/api/settings/ai', createAIConfig);
app.put('/api/settings/ai/:id', updateAIConfig);
app.delete('/api/settings/ai/:id', deleteAIConfig);
app.post('/api/settings/ai/:id/test', testAIConfig);

// Settings - AI Providers
app.get('/api/settings/providers', getAIProviders);
app.post('/api/settings/providers', createAIProvider);
app.put('/api/settings/providers/:id', updateAIProvider);

// Settings - AI Models
app.get('/api/settings/models', getAIModels);
app.post('/api/settings/models', createAIModel);
app.put('/api/settings/models/:id', updateAIModel);

// Task routes
app.get('/api/tasks', getTasks);
app.get('/api/tasks/:id', getTaskById);
app.post('/api/tasks', createTask);
app.delete('/api/tasks/:id', deleteTask);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`Server running on port ${PORT}`);
});