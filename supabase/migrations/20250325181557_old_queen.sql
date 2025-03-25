/*
  # Fix model field naming conflict

  1. Changes
    - Rename `model` column to `model_name` in `ai_config` table
    - Add missing advanced configuration fields
*/

-- Rename model column to model_name
ALTER TABLE ai_config 
RENAME COLUMN model TO model_name;