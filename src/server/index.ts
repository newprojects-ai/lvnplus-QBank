import express from 'express';
import cors from 'cors';
import { login } from './auth';
import { authenticate } from './middleware';
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
app.post('/api/settings/ai/:id/test', testAIConfig);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await checkDatabaseConnection();
  console.log(`Server running on port ${PORT}`);
});