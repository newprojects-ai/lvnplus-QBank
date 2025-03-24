/*
  # Fix difficulty level field naming conflict

  1. Changes
    - Rename `difficulty_level` column to `difficulty_value` in `templates` table
    - Update column comment to clarify its purpose
*/

-- Rename the difficulty_level column to difficulty_value
ALTER TABLE templates 
RENAME COLUMN difficulty_level TO difficulty_value;

-- Add a comment to clarify the purpose of the column
ALTER TABLE templates 
MODIFY COLUMN difficulty_value TINYINT COMMENT 'Numeric value representing difficulty (0-5)';