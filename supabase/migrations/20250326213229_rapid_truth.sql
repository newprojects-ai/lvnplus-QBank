/*
  # Add Prompt Templates and Tasks

  1. New Tables
    - `prompt_templates`: Stores prompt templates with variables
    - `tasks`: Stores task executions with variable values

  2. Changes
    - Remove format fields from templates table
    - Add prompt_template_id to templates table
    - Add appropriate indexes and constraints
*/

-- Create prompt_templates table
CREATE TABLE prompt_templates (
  id varchar(36) PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  template_text text NOT NULL,
  variables text NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id varchar(36) PRIMARY KEY,
  template_id varchar(36) NOT NULL,
  variable_values text NOT NULL,
  status varchar(20) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp,
  error_message text,
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id)
);

-- Modify templates table
ALTER TABLE templates
  DROP COLUMN question_format,
  DROP COLUMN options_format,
  DROP COLUMN solution_format,
  ADD COLUMN prompt_template_id varchar(36),
  ADD CONSTRAINT templates_prompt_template_fk 
  FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates(id);

-- Add index for better query performance
CREATE INDEX idx_templates_prompt_template ON templates (prompt_template_id);
CREATE INDEX idx_tasks_template ON tasks (template_id);