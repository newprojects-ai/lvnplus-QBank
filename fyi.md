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

### April 1, 2025
- Added variable management system
  - Variable categories with icons and colors
  - Predefined variables for common use cases
  - Template variable usage tracking
  - Support for validation rules and options
- Added default categories:
  - General (common variables)
  - Mathematics (equation-specific variables)
  - Science (scientific notation, units)
  - Language (grammar, proficiency levels)
- Enhanced settings page with:
  - AI configuration management
  - Provider management
  - Model management
  - Variable category and definition management
- Added Variable Management System
  - Created new database tables: variable_types, variable_options, variable_categories, variable_definitions, template_variable_usage
  - Added support for variable categorization and reuse
- Implemented Tasks Feature
  - Added server-side API endpoints for tasks (GET, POST, DELETE)
  - Implemented task processing with AI integration
  - Added support for template processing with variable substitution
  - Connected to existing AI configuration system
  - Tasks provide a flexible way to process templates with custom variables

### April 2, 2025
- Implemented minimalistic version of the variables functionality
  - Simplified the TasksPage.tsx to focus on specific variables from the sample task configuration
  - Updated the templates.ts file to handle basic variable extraction from template text
  - Modified the tasks.ts file to process tasks with the specific variables
  - Implemented validation for the required variables (topic, subtopic, total_questions)
  - Added support for optional variables (difficulty_distribution, katex_style)
  - Simplified the UI to focus on the core variables needed for task creation
  - Fixed TypeScript errors and improved error handling
  - Updated routes in index.ts to match the simplified implementation

### April 2, 2025 (Update - 22:18)
- Restored and enhanced the Task Creation UI
  - Restored the previous user-friendly format for the task creation interface
  - Enhanced the task creation process to incorporate new requirements
  - Fixed the form submission and variable handling functionality
  - Improved error handling for API calls to provide better user feedback
  - Added loading states for better user experience
  - Fixed the template selection dropdown to show loading state
  - Enhanced the prompt preview with syntax highlighting
  - Added validation for required variables and difficulty distribution
  - Implemented proper data fetching for subjects, topics, and subtopics
  - Fixed TypeScript errors and improved code organization
  - Updated the styling for consistency with the rest of the application
  - Organized variable inputs into logical sections for better usability
  - Added custom difficulty distribution controls with visual feedback
  - Improved the modal layout and form submission process

### April 3, 2025
- Restored and enhanced the Task Creation UI
  - Restored the previous user-friendly format for the task creation interface
  - Enhanced the task creation process to incorporate new requirements
  - Fixed the form submission and variable handling functionality
  - Improved error handling for API calls to provide better user feedback
  - Added loading states for better user experience
  - Fixed the template selection dropdown to show loading state
  - Enhanced the prompt preview with syntax highlighting
  - Added validation for required variables and difficulty distribution
  - Implemented proper data fetching for subjects, topics, and subtopics
  - Fixed TypeScript errors and improved code organization
  - Updated the styling for consistency with the rest of the application

### April 3, 2025 (Update - 13:25)
- Fixed authentication issues in the Task Creation UI
  - Added proper authentication handling for API requests
  - Implemented automatic login functionality to ensure API access
  - Updated all API endpoint URLs to match the server routes
  - Added token-based authentication with localStorage persistence
  - Improved error handling for authentication failures
  - Fixed the task creation and deletion mutations to use authenticated requests
  - Updated the data fetching for subjects, topics, and subtopics to use authenticated requests
  - Added proper loading states during authentication process

### April 3, 2025 (Update - 13:30)
- Fixed authentication and template loading issues in the Task Creation UI
  - Updated authentication credentials to use the correct test user (test@example.com/test123)
  - Added proper error handling for authentication failures with user-friendly error messages
  - Implemented a retry mechanism for authentication
  - Added direct template fetching that bypasses authentication when possible
  - Enhanced the template selection dropdown with loading indicators
  - Added retry buttons for both authentication and template loading
  - Improved error handling for API requests with more detailed error messages
  - Added authentication status indicators in the UI
  - Fixed conditional rendering issues in the template selection UI
  - Implemented better state management for authentication and loading states

### April 3, 2025 (Update - 14:45)
- Fixed Task UI issues:
  - Reorganized the "Additional Parameters" section into collapsible groups (Basic Settings, Content Settings, Formatting Settings, Advanced Settings) to reduce scrolling and improve organization
  - Fixed the "Prompt Preview" section to properly display template previews and highlight missing variables
  - Added error handling and a retry button for the prompt preview generation
  - Fixed the Create Task button being disabled by improving the validation logic
  - Added a Task Creation Status section to help users understand what requirements need to be met before creating a task
  - Fixed property access errors in the template variable handling
  - Improved variable replacement in the prompt preview to show which variables still need values
  - Enhanced the UI with better visual indicators for required fields and validation status

### April 3, 2025 (Update - 15:05)
- Further improved Task UI:
  - Reorganized parameter groups with more meaningful categories:
    - "Question Settings" - Core question parameters
    - "Content Options" - Text and content-related options
    - "Display Options" - Visual formatting settings
    - "Technical Settings" - API and configuration options
  - Added proper KaTeX style dropdown with options: None, Minimal, Standard, and Full
  - Fixed difficulty distribution to use proper difficulty levels (0-5) instead of generic levels
  - Added descriptive labels for each difficulty level (Easiest, Easy, Medium, Hard, Very Hard, Hardest)
  - Fixed prompt preview rendering to properly display template variables without showing HTML tags
  - Improved error handling in the prompt preview with better retry mechanism
  - Added square brackets around variable placeholders for better visibility

### April 3, 2025 (Update - 15:25)
- Enhanced Task UI with improved selection capabilities and clearer descriptions:
  - Added detailed descriptions for each parameter group to explain their purpose:
    - "Question Settings": Core parameters that control the type, quantity, and structure of questions
    - "Content Options": Settings that affect the text content, wording, and instructional aspects
    - "Display Options": Visual formatting settings including KaTeX math rendering options
    - "Technical Settings": Advanced configuration options for APIs and system-level settings
  - Implemented multiple selection for topics and subtopics:
    - Changed topic selection from dropdown to checkboxes for selecting multiple topics
    - Changed subtopic selection from dropdown to checkboxes for selecting multiple subtopics
    - Added support for selecting just a subject, subject with multiple topics, or all three levels
    - Updated form validation to work with multiple selections
    - Improved the UI to clearly show which topics and subtopics are selected

### April 3, 2025 (Update - 15:35)
- Fixed Task UI issues based on user feedback:
  - Improved the prompt preview to properly inject variable values into templates
  - Completely redesigned the topic and subtopic selection UI:
    - Added "Select All" and "Clear All" buttons for quick selection
    - Implemented a grid layout with highlighted selected items
    - Added visual feedback showing how many topics/subtopics are selected
    - Improved loading indicators and empty state messages
  - Simplified the parameter sections by removing Question Settings and Content Options
  - Kept only Display Options and Technical Settings for this version
  - Fixed the variable replacement in the prompt preview to correctly show the template with values

### April 3, 2025 (Update - 16:00)
- Fixed template functionality and improved UI based on user feedback:
  - Removed the Technical Settings section as it's not needed for this version
  - Completely redesigned the template selection UI:
    - Changed from dropdown to collapsible line items with radio buttons
    - Added template descriptions and an expand/collapse button for each template
    - Templates now show a preview of their content when expanded
    - Variables in templates are clearly highlighted with yellow background
  - Improved topic and subtopic selection:
    - Reorganized the UI with subject selection in a separate section
    - Added a View/Select mode toggle to separate viewing subtopics from selecting them
    - Topics and subtopics now appear side by side for better usability
    - View mode allows seeing subtopics without changing selections
    - Select mode allows choosing multiple topics and subtopics
  - Fixed prompt preview to properly highlight variables:
    - Variables with values are shown in green with their current value
    - Variables without values are shown in yellow with a "NEEDS VALUE" indicator
    - Fixed HTML injection issues in the template display
    - Improved error handling and retry mechanism

### April 3, 2025 (Update - 17:57)
- Fixed template functionality and improved UI based on user feedback:
  - Fixed template selection to use a dropdown menu instead of collapsible line items
  - Added template details view that can be toggled with a "Show/Hide template details" button
  - Simplified Display Options to only show KaTeX style dropdown, removing all other options
  - Completely redesigned topic/subtopic selection:
    - Improved the UI to show topics on the left and subtopics on the right
    - Single click on a topic focuses on it and shows its subtopics on the right panel
    - Checkbox selection for including topics and subtopics in the task
    - Added "Select All" and "Clear All" buttons for both topics and subtopics
    - Added a summary section showing the count of selected topics and subtopics
  - Fixed prompt preview to properly highlight variables:
    - Variables with values are shown in green with their current value
    - Variables without values are shown in yellow with a "NEEDS VALUE" indicator
    - Fixed HTML injection issues in the template display
    - Improved error handling and retry mechanism

### April 4, 2025 (Update - 10:20)
- Fixed several issues with the Task UI based on user feedback:
  - Improved Topic/Subtopic selection functionality:
    - Added color-coding for topics based on subtopic selection status:
      - Green highlight for topics with all subtopics selected
      - Yellow highlight for topics with some subtopics selected
      - No highlight for topics with no subtopics selected
    - Fixed the ability to click on a topic to see its subtopics
    - Selected subtopics now have a green background for better visibility
    - Added count of selected subtopics under each topic name
  - Fixed default values in the prompt preview:
    - Default value for "Total Questions" (10) is now properly injected into the prompt preview
    - Default "Balanced Distribution" is now reflected in the prompt preview
    - Added proper variable substitution for all template variables
  - Improved Task Creation Status:
    - Added clear "Ready to create" / "Not ready" status indicator
    - Fixed validation to properly check all required fields
    - Status now updates in real-time as fields are filled
  - Added "Balanced" distribution preset as the default option

### April 7, 2025
- Fixed authentication issues by adding Authorization headers to API calls.
  - Modified `src/pages/PromptTemplatesPage.tsx` to include `Authorization: Bearer <token>` in headers for all `fetch` calls using `localStorage.getItem('auth_token')`.
  - Modified `src/pages/SettingsPage.tsx` similarly for all API calls within `useQuery` and event handlers.
  - Modified `src/components/settings/VariableModal.tsx` to add the Authorization header to the `/api/variable-types` fetch call.

### April 7, 2025 (Update - 22:34:00)
 
 **What:** Added Authorization headers to API calls.
-**Why:** To resolve persistent 401 Unauthorized errors when accessing data.
+**Why:** To resolve 401 Unauthorized errors when accessing data.
 **How:** 
 - Modified `src/pages/PromptTemplatesPage.tsx` to include `Authorization: Bearer <token>` in headers for all `fetch` calls using `localStorage.getItem('auth_token')`.
 - Modified `src/pages/SettingsPage.tsx` similarly for all API calls within `useQuery` and event handlers.
 - Modified `src/components/settings/VariableModal.tsx` to add the Authorization header to the `/api/variable-types` fetch call.

### April 7, 2025 (Update - 22:31:00)
 
 **What:** Corrected token retrieval logic.
 **Why:** A previous fix incorrectly introduced a hardcoded placeholder token in `PromptTemplatesPage.tsx`, still causing 401 errors.
 **How:** 
 - Removed the hardcoded `const token = 'your_token_here';` from `src/pages/PromptTemplatesPage.tsx`.
 - Ensured `localStorage.getItem('auth_token')` is called within the component function scope.
 - Added explicit token checks within `useQuery` `queryFn` callbacks and before mutation calls (`handleSubmit`, `handleDelete`) in `PromptTemplatesPage.tsx` to prevent requests/mutations without a valid token and provide user feedback via toasts.

### April 7, 2025 (Update - 22:37:00)
 
 **What:** Corrected API endpoint path in `TasksPage`.
 **Why:** The `TasksPage` was attempting to fetch template details using `/api/templates/:id` instead of the correct `/api/prompt-templates/:id`, resulting in 404 Not Found errors.
 **How:** 
 - Modified the `useEffect` hook in `src/pages/TasksPage.tsx` (around line 521) to change the `fetch` URL from `/api/templates/${selectedTemplate}` to `/api/prompt-templates/${selectedTemplate}`.
 - Improved error logging in the same fetch call to include `response.statusText`.

### April 8, 2025
**Date:** 2025-04-08 13:13 (approx)
**File:** `src/pages/TasksPage.tsx`
**Change:** Corrected default value initialization logic in `useEffect` (lines ~599-635) and restored the `renderTopicSubtopicSelection()` call in `renderVariableInputs` (line ~1095).
**Reason:** The default values for `totalQuestions` and `difficulty_distribution` were not being set correctly, and the Subject/Topic/Subtopic selection UI was mistakenly removed in a previous edit. This corrects the default value logic and restores the required UI component.
**How:** Used `edit_file` tool to modify the `useEffect` hook and the `renderVariableInputs` function.

### April 8, 2025
**Date:** 2025-04-08 13:28 (approx)
**File:** `src/pages/TasksPage.tsx`
**Change:** Added detailed logging and more robust checks to the `areRequiredVariablesFilled` function (lines ~825-843).
**Reason:** To debug the "Not Ready" status and the unexpected console error during task validation. The previous logging was insufficient to pinpoint the exact cause.
**How:** Used `edit_file` tool to add `console.log` statements for the full variable object and improved the check for missing/empty values.

### April 17, 2025 12:28pm BST

### Monorepo Migration - Phase 1 (Scaffold)

**What:**
- Created new monorepo folder structure: `packages/core`, `packages/ui`, `packages/api`, `packages/features`, `apps/web` and their respective `src` subfolders.
- Added/initialized package.json and tsconfig.json files for each package and app, using the monorepo migration guide as reference.
- Updated root package.json to use Turborepo workspaces, removed old scripts/dependencies.
- Added root turbo.json and replaced root tsconfig.json with base config for all packages.

**Why:**
- To split the monorepo into manageable packages for better modularity, maintainability, and reduced token consumption in BOLT.
- To prepare for migration of types, utilities, UI components, API clients/hooks, and feature logic into new packages.

**How:**
- Used PowerShell and file operations to scaffold the directory structure and configuration files.
- Carefully followed the provided migration guide for all config templates.

**Next:**
- Begin Phase 2: Migrating core types and utilities from `src/types` and `src/utils` to `packages/core`.
- Log all further actions and rationale here.

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
3. variable_types
4. variable_options
5. variable_categories
6. variable_definitions
7. template_variable_usage
8. generation_batches
9. generated_questions
10. qbank_users
11. export_logs
12. ai_config
13. ai_providers
14. ai_models

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
- GET /api/variable-categories
- POST /api/variable-categories
- PUT /api/variable-categories/:id
- DELETE /api/variable-categories/:id
- GET /api/variable-definitions/:categoryId
- POST /api/variable-definitions
- PUT /api/variable-definitions/:id
- DELETE /api/variable-definitions/:id
- GET /api/template-variables/:templateId
- PUT /api/template-variables/:templateId

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

### Tasks
- GET /api/tasks - Get all tasks
- GET /api/tasks/:id - Get a specific task
- POST /api/tasks - Create a new task
- DELETE /api/tasks/:id - Delete a task

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
April 17, 2025