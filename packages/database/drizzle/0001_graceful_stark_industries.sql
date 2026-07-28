CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`user_id` text,
	`ip_address` text,
	`user_agent` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_log_event_idx` ON `audit_log` (`event`);--> statement-breakpoint
CREATE INDEX `audit_log_userId_idx` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_log_createdAt_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_application` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`allowed_origins` text DEFAULT '[]',
	`redirect_urls` text DEFAULT '[]',
	`publishable_key` text NOT NULL,
	`secret_key` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_application`("id", "name", "slug", "domain", "allowed_origins", "redirect_urls", "publishable_key", "secret_key", "owner_id", "created_at", "updated_at") SELECT "id", "name", "slug", "domain", "allowed_origins", "redirect_urls", "publishable_key", "secret_key", "owner_id", "created_at", "updated_at" FROM `application`;--> statement-breakpoint
DROP TABLE `application`;--> statement-breakpoint
ALTER TABLE `__new_application` RENAME TO `application`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `application_slug_unique` ON `application` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `application_publishable_key_unique` ON `application` (`publishable_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `application_secret_key_unique` ON `application` (`secret_key`);--> statement-breakpoint
CREATE INDEX `application_ownerId_idx` ON `application` (`owner_id`);