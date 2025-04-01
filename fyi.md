# QBank Development Log

## Project Overview
QBank is a question bank generation system that uses AI to create, manage, and export educational questions. The system supports multiple AI providers and includes features for template management, question generation, review, and export.

## Technology Stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Backend: Express.js
- Database: MariaDB
- ORM: Prisma
- AI Providers: OpenAI, DeepSeek

## Development Timeline

### March 23, 2025
- Initial project setup with React, TypeScript, and Vite
- Added Tailwind CSS for styling
- Implemented basic routing structure
- Created base layout with sidebar navigation

### March 24, 2025
- Set up MariaDB database integration
- Configured Prisma ORM
- Created initial database schema for:
  - Templates
  - Generation batches
  - Generated questions
  - Users
  - Export logs
  - AI configurations

### March 25, 2025
- Implemented authentication system
- Added login page and JWT-based authentication
- Created protected routes

### March 26, 2025
- Developed template management system
- Added CRUD operations for templates
- Implemented template form with validation

### March 27, 2025
- Added question generation feature
- Integrated OpenAI API
- Implemented batch generation system
- Added progress tracking for generation

### March 28, 2025
- Created question review interface
- Added approval/rejection functionality
- Implemented question editing capabilities
- Added KaTeX support for mathematical notation

### March 29, 2025
- Added export functionality
- Implemented export tracking system
- Created export logs

### March 30, 2025
- Added DeepSeek AI integration
- Implemented AI configuration management
- Added configuration testing feature
- Updated settings page with AI configuration UI

### March 31, 2025
- Enhanced prompt template management system
- Added variable types and options support
- Implemented structured template variables
- Added validation for template creation
- Improved template creation UI
- Added support for predefined variable types:
  - Text
  - Text Area
  - Number
  - Select
  - Multi Select
  - Subject
  - Topic
  - Subtopic
  - Difficulty Level

## Current Features

### Authentication
- Email/password login
- JWT-based authentication
- Protected routes

### Template Management
- Create, edit, delete templates
- Template format specification
- Structured variable management
- Predefined variable types
- Variable validation
- Example question support
- Subject/topic/subtopic organization

### Question Generation
- AI-powered question generation
- Multiple AI provider support (OpenAI, DeepSeek)
- Batch generation
- Progress tracking
- Error handling

### Question Review
- Question approval/rejection
- Content editing
- Mathematical notation support
- Batch management

### Export System
- Question export functionality
- Export status tracking
- Export logs
- Error handling

### AI Configuration
- Multiple AI provider support
- Configuration management
- API key management
- Model selection
- Parameter customization
- Configuration testing

### Dashboard
- Generation statistics
- Question status overview
- Recent batch tracking

## Database Schema

### Tables
1. templates
2. prompt_templates
3. template_variables
4. variable_types
5. variable_options
6. generation_batches
7. generated_questions
8. qbank_users
9. export_logs
10. ai_config
11. ai_providers
12. ai_models

## API Endpoints

### Authentication
- POST /api/auth/login

### Templates
- GET /api/templates
- POST /api/templates
- PUT /api/templates/:id
- DELETE /api/templates/:id

### Prompt Templates
- GET /api/prompt-templates
- POST /api/prompt-templates
- PUT /api/prompt-templates/:id
- DELETE /api/prompt-templates/:id

### Variable Management
- GET /api/variable-types
- GET /api/variable-options

### Questions
- POST /api/generate
- POST /api/questions/:id/approve
- PUT /api/questions/:id
- DELETE /api/questions/:id

### Dashboard
- GET /api/dashboard/stats

### Export
- POST /api/export

### Settings
- GET /api/settings/ai
- POST /api/settings/ai
- PUT /api/settings/ai/:id
- DELETE /api/settings/ai/:id
- POST /api/settings/ai/:id/test

## Environment Configuration
- DATABASE_URL: MariaDB connection string
- JWT_SECRET: Secret key for JWT signing

## Future Improvements
1. Add support for more AI providers
2. Implement batch template generation
3. Add question categorization
4. Implement advanced search functionality
5. Add user management system
6. Implement role-based access control
7. Add support for question versioning
8. Implement question quality metrics
9. Add automated testing for generated questions
10. Implement bulk operations for questions

## Known Issues
- None currently reported

## Last Updated
March 31, 2025