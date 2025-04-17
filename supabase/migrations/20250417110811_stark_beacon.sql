-- CreateTable
CREATE TABLE `templates` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `tags` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_active` BOOLEAN DEFAULT true,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_versions` (
  `id` VARCHAR(36) NOT NULL,
  `template_id` VARCHAR(36) NOT NULL,
  `version` INTEGER NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `template_versions_template_id_version_key`(`template_id`, `version`),
  CONSTRAINT `template_versions_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_variables` (
  `id` VARCHAR(36) NOT NULL,
  `template_version_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `default_value` TEXT NULL,
  `validation_rules` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `is_required` BOOLEAN DEFAULT true,
  `sort_order` INTEGER DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `template_variables_template_version_id_fkey` FOREIGN KEY (`template_version_id`) REFERENCES `template_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndexes
CREATE INDEX `idx_templates_category` ON `templates`(`category`);
CREATE INDEX `idx_template_versions_template` ON `template_versions`(`template_id`);
CREATE INDEX `idx_template_variables_version` ON `template_variables`(`template_version_id`);