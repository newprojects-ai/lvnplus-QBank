/*
  Warnings:

  - Added the required column `name` to the `ai_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ai_config` ADD COLUMN `name` VARCHAR(255) NOT NULL;
