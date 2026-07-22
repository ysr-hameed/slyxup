CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`details` text,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `test_results` (
	`id` text PRIMARY KEY NOT NULL,
	`test_name` text NOT NULL,
	`endpoint` text NOT NULL,
	`passed` integer NOT NULL,
	`response_status` integer,
	`response_body` text,
	`error` text,
	`run_at` text DEFAULT 'datetime(''now'')' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `platform` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_users_platform` ON `users` (`platform`);--> statement-breakpoint
ALTER TABLE `invoices` ADD `platform` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_invoices_platform` ON `invoices` (`platform`);--> statement-breakpoint
ALTER TABLE `plans` ADD `platform` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `platform` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_subscriptions_platform` ON `subscriptions` (`platform`);