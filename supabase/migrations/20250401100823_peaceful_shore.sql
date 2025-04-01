/*
  # Add Variable Management System

  1. New Tables
    - `variable_types`: Predefined variable types (text, number, select, etc.)
    - `variable_options`: Options for select/multi-select variables
    - `variable_categories`: Groups variables by category (e.g., Math, Science)
    - `variable_definitions`: Stores variable definitions with metadata
    - `template_variable_usage`: Links templates to variables

  2. Changes
    - Add support for variable categorization and reuse
    - Add validation and default values
    - Add proper foreign key constraints and indexes
*/

-- Create variable_types table
CREATE TABLE IF NOT EXISTS variable_types (
  id varchar(50) PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  has_options boolean DEFAULT false,
  validation_rules text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create variable_options table
CREATE TABLE IF NOT EXISTS variable_options (
  id varchar(36) PRIMARY KEY,
  variable_type_id varchar(50) NOT NULL,
  value varchar(255) NOT NULL,
  label varchar(255) NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variable_type_id) REFERENCES variable_types(id)
);

-- Create variable_categories table
CREATE TABLE IF NOT EXISTS variable_categories (
  id varchar(36) PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  icon varchar(50),
  color varchar(20),
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) NOT NULL
);

-- Create variable_definitions table
CREATE TABLE IF NOT EXISTS variable_definitions (
  id varchar(36) PRIMARY KEY,
  category_id varchar(36) NOT NULL,
  name varchar(100) NOT NULL,
  display_name varchar(255) NOT NULL,
  description text,
  placeholder text,
  variable_type_id varchar(50) NOT NULL,
  default_value text,
  validation_rules text,
  options text,
  is_required boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES variable_categories(id),
  FOREIGN KEY (variable_type_id) REFERENCES variable_types(id)
);

-- Create template_variable_usage table
CREATE TABLE IF NOT EXISTS template_variable_usage (
  id varchar(36) PRIMARY KEY,
  template_id varchar(36) NOT NULL,
  variable_id varchar(36) NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id),
  FOREIGN KEY (variable_id) REFERENCES variable_definitions(id),
  UNIQUE (template_id, variable_id)
);

-- Insert predefined variable types
INSERT INTO variable_types (id, name, description, has_options) VALUES
  ('text', 'Text', 'Single line text input', false),
  ('textarea', 'Text Area', 'Multi-line text input', false),
  ('number', 'Number', 'Numeric input with optional validation', false),
  ('select', 'Select', 'Single selection from predefined options', true),
  ('multi-select', 'Multi Select', 'Multiple selections from predefined options', true),
  ('subject', 'Subject', 'Subject selection from LVNPLUS subjects', true),
  ('topic', 'Topic', 'Topic selection based on selected subject', true),
  ('subtopic', 'Subtopic', 'Subtopic selection based on selected topic', true),
  ('difficulty', 'Difficulty Level', 'Difficulty level selection', true);

-- Insert default categories
INSERT INTO variable_categories (id, name, description, icon, color, sort_order, created_by) VALUES
  ('general', 'General', 'Common variables for all subjects', 'Settings', 'gray', 0, 'system'),
  ('math', 'Mathematics', 'Math-specific variables', 'Calculator', 'blue', 1, 'system'),
  ('science', 'Science', 'Science-specific variables', 'Flask', 'green', 2, 'system'),
  ('language', 'Language', 'Language and grammar variables', 'BookOpen', 'purple', 3, 'system');

-- Insert common variables
INSERT INTO variable_definitions 
  (id, category_id, name, display_name, description, placeholder, variable_type_id, default_value, validation_rules, is_required, sort_order, created_by)
VALUES
  ('difficulty', 'general', 'difficulty', 'Difficulty Level', 'Question difficulty level', 'Select difficulty level', 'difficulty', '3', NULL, true, 0, 'system'),
  ('topic', 'general', 'topic', 'Topic', 'Main topic for the question', 'Select topic', 'topic', NULL, NULL, true, 1, 'system'),
  ('subtopic', 'general', 'subtopic', 'Subtopic', 'Specific subtopic', 'Select subtopic', 'subtopic', NULL, NULL, true, 2, 'system'),
  ('concept', 'general', 'concept', 'Key Concept', 'Main concept being tested', 'Enter the key concept', 'text', NULL, NULL, true, 3, 'system'),
  ('skill_level', 'general', 'skill_level', 'Skill Level', 'Required skill level', 'Select skill level', 'select', 'intermediate', '["beginner","intermediate","advanced"]', true, 4, 'system'),
  
  ('equation_type', 'math', 'equation_type', 'Equation Type', 'Type of mathematical equation', 'Select equation type', 'select', 'linear', '["linear","quadratic","exponential","logarithmic"]', true, 0, 'system'),
  ('variable_count', 'math', 'variable_count', 'Number of Variables', 'Number of variables in the equation', 'Enter number of variables', 'number', '1', '{"min":1,"max":5}', true, 1, 'system'),
  ('solution_steps', 'math', 'solution_steps', 'Solution Steps', 'Number of steps in the solution', 'Enter number of steps', 'number', '3', '{"min":1,"max":10}', true, 2, 'system'),
  
  ('scientific_notation', 'science', 'scientific_notation', 'Use Scientific Notation', 'Whether to use scientific notation', 'Select yes/no', 'select', 'false', '["true","false"]', false, 0, 'system'),
  ('unit_system', 'science', 'unit_system', 'Unit System', 'Measurement unit system', 'Select unit system', 'select', 'SI', '["SI","Imperial"]', true, 1, 'system'),
  
  ('grammar_focus', 'language', 'grammar_focus', 'Grammar Focus', 'Specific grammar point', 'Enter grammar focus', 'text', NULL, NULL, true, 0, 'system'),
  ('language_level', 'language', 'language_level', 'Language Level', 'Language proficiency level', 'Select level', 'select', 'B1', '["A1","A2","B1","B2","C1","C2"]', true, 1, 'system');

-- Add indexes for better query performance
CREATE INDEX idx_variable_definitions_category ON variable_definitions (category_id);
CREATE INDEX idx_template_variable_usage_template ON template_variable_usage (template_id);
CREATE INDEX idx_template_variable_usage_variable ON template_variable_usage (variable_id);
CREATE INDEX idx_variable_options_type ON variable_options (variable_type_id);