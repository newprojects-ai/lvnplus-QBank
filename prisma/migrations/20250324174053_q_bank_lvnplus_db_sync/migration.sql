/*
  Warnings:

  - You are about to drop the column `difficulty_level` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `subject_name` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `subtopic_name` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `topic_name` on the `templates` table. All the data in the column will be lost.
  - Added the required column `difficulty_value` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level_id` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtopic_id` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic_id` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `templates` DROP COLUMN `difficulty_level`,
    DROP COLUMN `subject_name`,
    DROP COLUMN `subtopic_name`,
    DROP COLUMN `topic_name`,
    ADD COLUMN `difficulty_value` TINYINT NOT NULL,
    ADD COLUMN `level_id` INTEGER NOT NULL,
    ADD COLUMN `subject_id` INTEGER NOT NULL,
    ADD COLUMN `subtopic_id` INTEGER NOT NULL,
    ADD COLUMN `topic_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `subjects` (
    `subject_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `subjects_subject_name_key`(`subject_name`),
    PRIMARY KEY (`subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `topic_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `topic_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `topics_subject_id_topic_name_key`(`subject_id`, `topic_name`),
    PRIMARY KEY (`topic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subtopics` (
    `subtopic_id` INTEGER NOT NULL AUTO_INCREMENT,
    `topic_id` INTEGER NOT NULL,
    `subtopic_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `subtopics_topic_id_subtopic_name_key`(`topic_id`, `subtopic_name`),
    PRIMARY KEY (`subtopic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `difficulty_levels` (
    `level_id` INTEGER NOT NULL AUTO_INCREMENT,
    `level_name` VARCHAR(50) NOT NULL,
    `level_value` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `purpose` TEXT NOT NULL,
    `characteristics` TEXT NOT NULL,
    `focus_area` TEXT NOT NULL,
    `steps_required` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `difficulty_levels_level_name_key`(`level_name`),
    UNIQUE INDEX `difficulty_levels_level_value_key`(`level_value`),
    PRIMARY KEY (`level_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `templates_subject_id_idx` ON `templates`(`subject_id`);

-- CreateIndex
CREATE INDEX `templates_topic_id_idx` ON `templates`(`topic_id`);

-- CreateIndex
CREATE INDEX `templates_subtopic_id_idx` ON `templates`(`subtopic_id`);

-- CreateIndex
CREATE INDEX `templates_level_id_idx` ON `templates`(`level_id`);

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subtopics` ADD CONSTRAINT `subtopics_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`topic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `difficulty_levels` ADD CONSTRAINT `difficulty_levels_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`topic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_subtopic_id_fkey` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics`(`subtopic_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_level_id_fkey` FOREIGN KEY (`level_id`) REFERENCES `difficulty_levels`(`level_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generation_batches` ADD CONSTRAINT `generation_batches_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_questions` ADD CONSTRAINT `generated_questions_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `generation_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `export_logs` ADD CONSTRAINT `export_logs_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `generation_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
