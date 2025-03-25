/*
  # Add AI Models and Providers Management

  1. New Tables
    - `ai_providers`: Stores AI provider information
    - `ai_models`: Stores model information for each provider

  2. Changes
    - Update ai_config table to reference models table
    - Add appropriate indexes and constraints

  3. Notes
    - Providers and models are pre-populated with common options
    - Models include their specific configuration options
*/

-- Create providers table
CREATE TABLE ai_providers (
  id varchar(50) PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  api_base_url varchar(255),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  active boolean DEFAULT true
);

-- Create models table
CREATE TABLE ai_models (
  id varchar(50) PRIMARY KEY,
  provider_id varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  max_tokens int DEFAULT 2048,
  supports_functions boolean DEFAULT false,
  supports_vision boolean DEFAULT false,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  active boolean DEFAULT true,
  FOREIGN KEY (provider_id) REFERENCES ai_providers(id),
  UNIQUE (provider_id, name)
);

-- Add model_id to ai_config
ALTER TABLE ai_config
  ADD COLUMN model_id varchar(50),
  ADD CONSTRAINT ai_config_model_fk 
  FOREIGN KEY (model_id) REFERENCES ai_models(id);

-- Insert initial providers
INSERT INTO ai_providers (id, name, description) VALUES
  ('openai', 'OpenAI', 'OpenAI API provider for GPT models'),
  ('deepseek', 'DeepSeek', 'DeepSeek AI models for chat and code generation');

-- Insert initial models
INSERT INTO ai_models (id, provider_id, name, description, max_tokens) VALUES
  ('gpt-4', 'openai', 'GPT-4', 'Most capable GPT-4 model', 8192),
  ('gpt-3.5-turbo', 'openai', 'GPT-3.5 Turbo', 'Fast and efficient GPT-3.5 model', 4096),
  ('deepseek-chat', 'deepseek', 'DeepSeek Chat', 'General purpose chat model', 2048),
  ('deepseek-coder', 'deepseek', 'DeepSeek Coder', 'Specialized code generation model', 2048);