/*
  # Add name field to AI configurations

  1. Changes
    - Add `name` column to `ai_config` table
    - Make name required
*/

ALTER TABLE ai_config ADD COLUMN name varchar(255) NOT NULL;