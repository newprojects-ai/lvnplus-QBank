/*
  Warnings:

  - You are about to drop the column `model` on the `ai_config` table. All the data in the column will be lost.
  - Added the required column `model_name` to the `ai_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ai_config` DROP COLUMN `model`,
    ADD COLUMN `frequency_penalty` DOUBLE NULL DEFAULT 0.0,
    ADD COLUMN `max_length` INTEGER NULL DEFAULT 2048,
    ADD COLUMN `model_id` VARCHAR(191) NULL,
    ADD COLUMN `model_name` VARCHAR(50) NOT NULL,
    ADD COLUMN `presence_penalty` DOUBLE NULL DEFAULT 0.0,
    ADD COLUMN `stop_sequences` VARCHAR(191) NULL DEFAULT '[]',
    ADD COLUMN `system_prompt` TEXT NULL,
    ADD COLUMN `top_k` INTEGER NULL DEFAULT 50,
    ADD COLUMN `top_p` DOUBLE NULL DEFAULT 0.9;

-- CreateTable
CREATE TABLE `ai_providers` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `api_base_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_models` (
    `id` VARCHAR(50) NOT NULL,
    `provider_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `max_tokens` INTEGER NOT NULL DEFAULT 2048,
    `supports_functions` BOOLEAN NOT NULL DEFAULT false,
    `supports_vision` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `ai_models_provider_id_name_key`(`provider_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ai_config` ADD CONSTRAINT `ai_config_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_models` ADD CONSTRAINT `ai_models_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
