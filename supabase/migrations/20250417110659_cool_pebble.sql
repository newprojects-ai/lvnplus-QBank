/*
  # Add Template Management System

  1. New Tables
    - `templates`: Stores template information
    - `template_versions`: Stores version history for templates
    - `template_variables`: Stores variable definitions for templates

  2. Changes
    - Add support for template versioning
    - Add variable management
    - Add proper indexes and constraints
*/

-- Create templates table
CREATE TABLE templates (
  id varchar(36) PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  tags text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) NOT NULL,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT true
);

-- Create template_versions table
CREATE TABLE template_versions (
  id varchar(36) PRIMARY KEY,
  template_id varchar(36) NOT NULL,
  version int NOT NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(255) NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  UNIQUE (template_id, version)
);

-- Create template_variables table
CREATE TABLE template_variables (
  id varchar(36) PRIMARY KEY,
  template_version_id varchar(36) NOT NULL,
  name varchar(100) NOT NULL,
  display_name varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  description text,
  default_value text,
  validation_rules text,
  category varchar(100),
  is_required boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_version_id) REFERENCES template_versions(id)
);

-- Add indexes for better query performance
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_template_variables_version ON template_variables(template_version_id);