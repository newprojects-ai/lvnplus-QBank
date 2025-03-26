/*
  # Add predefined variable types and template structure

  1. New Tables
    - `variable_types`: Predefined variable types (text, number, select, etc.)
    - `variable_options`: Options for select/multi-select variables
    - `template_variables`: Links variables to templates with metadata

  2. Changes
    - Update prompt_templates to use structured variables
    - Add validation and default values
*/

-- Create variable_types table
CREATE TABLE variable_types (
  id varchar(50) PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  has_options boolean DEFAULT false,
  validation_rules text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create variable_options table
CREATE TABLE variable_options (
  id varchar(36) PRIMARY KEY,
  variable_type_id varchar(50) NOT NULL,
  value varchar(255) NOT NULL,
  label varchar(255) NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variable_type_id) REFERENCES variable_types(id)
);

-- Create template_variables table
CREATE TABLE template_variables (
  id varchar(36) PRIMARY KEY,
  template_id varchar(36) NOT NULL,
  name varchar(100) NOT NULL,
  display_name varchar(255) NOT NULL,
  description text,
  variable_type_id varchar(50) NOT NULL,
  is_required boolean DEFAULT true,
  default_value text,
  validation_rules text,
  options text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id),
  FOREIGN KEY (variable_type_id) REFERENCES variable_types(id)
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

-- Insert default options for difficulty level
INSERT INTO variable_options (id, variable_type_id, value, label, description, sort_order) VALUES
  (uuid(), 'difficulty', '1', 'Easy', 'Basic concepts and straightforward applications', 1),
  (uuid(), 'difficulty', '2', 'Medium-Easy', 'Slightly challenging applications of basic concepts', 2),
  (uuid(), 'difficulty', '3', 'Medium', 'Moderate complexity requiring concept combinations', 3),
  (uuid(), 'difficulty', '4', 'Medium-Hard', 'Complex applications requiring deep understanding', 4),
  (uuid(), 'difficulty', '5', 'Hard', 'Advanced problems requiring mastery of concepts', 5);

-- Add indexes for better query performance
CREATE INDEX idx_template_variables_template ON template_variables (template_id);
CREATE INDEX idx_variable_options_type ON variable_options (variable_type_id);