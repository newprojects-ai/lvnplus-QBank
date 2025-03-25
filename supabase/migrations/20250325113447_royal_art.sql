/*
  # Add name field to AI configurations

  1. Changes
    - Add `name` column to `ai_config` table
    - Set default name based on provider and model
    - Make name required
*/

-- Add name column with a default value
ALTER TABLE ai_config ADD COLUMN name varchar(255) NOT NULL DEFAULT '';

-- Update existing records to have a default name
UPDATE ai_config 
SET name = CONCAT(provider, ' - ', model) 
WHERE name = '';

-- Add a constraint to ensure name is not empty
ALTER TABLE ai_config ALTER COLUMN name DROP DEFAULT;