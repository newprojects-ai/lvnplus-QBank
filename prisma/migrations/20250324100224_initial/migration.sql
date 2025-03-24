-- CreateTable
CREATE TABLE `templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `subject_name` VARCHAR(100) NOT NULL,
    `topic_name` VARCHAR(100) NOT NULL,
    `subtopic_name` VARCHAR(100) NOT NULL,
    `difficulty_level` TINYINT NOT NULL,
    `question_format` TEXT NOT NULL,
    `options_format` TEXT NOT NULL,
    `solution_format` TEXT NOT NULL,
    `example_question` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generation_batches` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL,
    `difficulty_level` TINYINT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `ai_model` VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    `ai_temperature` DOUBLE NOT NULL DEFAULT 0.7,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_questions` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `subject_name` VARCHAR(100) NOT NULL,
    `topic_name` VARCHAR(100) NOT NULL,
    `subtopic_name` VARCHAR(100) NOT NULL,
    `question_text` TEXT NOT NULL,
    `question_text_plain` TEXT NOT NULL,
    `options` TEXT NOT NULL,
    `options_plain` TEXT NOT NULL,
    `correct_answer` VARCHAR(255) NOT NULL,
    `correct_answer_plain` VARCHAR(255) NOT NULL,
    `solution` TEXT NOT NULL,
    `solution_plain` TEXT NOT NULL,
    `difficulty_level` TINYINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `export_status` VARCHAR(20) NULL,
    `export_error` TEXT NULL,
    `lvnplus_question_id` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qbank_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `qbank_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `export_logs` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NULL,
    `question_ids` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `export_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rollback_time` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `lvnplus_question_ids` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_config` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `model` VARCHAR(50) NOT NULL,
    `api_key` VARCHAR(255) NOT NULL,
    `max_tokens` INTEGER NOT NULL DEFAULT 1000,
    `temperature` DOUBLE NOT NULL DEFAULT 0.7,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
