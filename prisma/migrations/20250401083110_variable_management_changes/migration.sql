/*
  Warnings:

  - You are about to drop the column `options_format` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `question_format` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `solution_format` on the `templates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `templates` DROP COLUMN `options_format`,
    DROP COLUMN `question_format`,
    DROP COLUMN `solution_format`,
    ADD COLUMN `prompt_template_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `prompt_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `template_text` TEXT NOT NULL,
    `variables` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `variable_values` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `templates_prompt_template_id_idx` ON `templates`(`prompt_template_id`);

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_prompt_template_id_fkey` FOREIGN KEY (`prompt_template_id`) REFERENCES `prompt_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `prompt_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
