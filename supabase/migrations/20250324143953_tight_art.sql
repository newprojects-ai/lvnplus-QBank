/*
  # Add LVNPLUS master data schema

  1. New Tables
    - `subjects`: Core subject information
    - `topics`: Subject-specific topics
    - `subtopics`: Topic-specific subtopics
    - `difficulty_levels`: Difficulty level definitions per subject

  2. Changes
    - Update templates table to use foreign keys to LVNPLUS tables
    - Add appropriate indexes and constraints

  3. Notes
    - Using MariaDB/MySQL specific syntax
    - Maintaining exact column types and constraints from LVNPLUS
*/

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  subject_id int(11) NOT NULL AUTO_INCREMENT,
  subject_name varchar(100) NOT NULL,
  description text DEFAULT NULL,
  PRIMARY KEY (subject_id),
  UNIQUE KEY subject_name (subject_name)
) ENGINE=InnoDB;

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  topic_id int(11) NOT NULL AUTO_INCREMENT,
  subject_id int(11) NOT NULL,
  topic_name varchar(100) NOT NULL,
  description text DEFAULT NULL,
  PRIMARY KEY (topic_id),
  UNIQUE KEY unique_topic (subject_id, topic_name),
  CONSTRAINT topics_ibfk_1 FOREIGN KEY (subject_id) REFERENCES subjects (subject_id)
) ENGINE=InnoDB;

-- Create subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
  subtopic_id int(11) NOT NULL AUTO_INCREMENT,
  topic_id int(11) NOT NULL,
  subtopic_name varchar(100) NOT NULL,
  description text DEFAULT NULL,
  PRIMARY KEY (subtopic_id),
  UNIQUE KEY unique_subtopic (topic_id, subtopic_name),
  CONSTRAINT subtopics_ibfk_1 FOREIGN KEY (topic_id) REFERENCES topics (topic_id)
) ENGINE=InnoDB;

-- Create difficulty_levels table
CREATE TABLE IF NOT EXISTS difficulty_levels (
  level_id int(11) NOT NULL AUTO_INCREMENT,
  level_name varchar(50) NOT NULL,
  level_value int(11) NOT NULL,
  subject_id int(11) NOT NULL,
  purpose text NOT NULL,
  characteristics text NOT NULL,
  focus_area text NOT NULL,
  steps_required varchar(50) DEFAULT NULL,
  created_at timestamp NULL DEFAULT current_timestamp(),
  active tinyint(1) DEFAULT 1,
  PRIMARY KEY (level_id),
  UNIQUE KEY level_name (level_name),
  UNIQUE KEY level_value (level_value),
  KEY difficulty_levels_subject_id_idx (subject_id),
  CONSTRAINT difficulty_levels_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (subject_id)
) ENGINE=InnoDB;

-- Modify templates table to use LVNPLUS references
ALTER TABLE templates
  DROP COLUMN subject_name,
  DROP COLUMN topic_name,
  DROP COLUMN subtopic_name,
  ADD COLUMN subject_id int(11) NOT NULL AFTER description,
  ADD COLUMN topic_id int(11) NOT NULL AFTER subject_id,
  ADD COLUMN subtopic_id int(11) NOT NULL AFTER topic_id,
  ADD COLUMN level_id int(11) NOT NULL AFTER difficulty_level,
  ADD CONSTRAINT templates_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (subject_id),
  ADD CONSTRAINT templates_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics (topic_id),
  ADD CONSTRAINT templates_subtopic_id_fkey FOREIGN KEY (subtopic_id) REFERENCES subtopics (subtopic_id),
  ADD CONSTRAINT templates_level_id_fkey FOREIGN KEY (level_id) REFERENCES difficulty_levels (level_id);

-- Add indexes for better query performance
CREATE INDEX idx_templates_subject_id ON templates (subject_id);
CREATE INDEX idx_templates_topic_id ON templates (topic_id);
CREATE INDEX idx_templates_subtopic_id ON templates (subtopic_id);
CREATE INDEX idx_templates_level_id ON templates (level_id);