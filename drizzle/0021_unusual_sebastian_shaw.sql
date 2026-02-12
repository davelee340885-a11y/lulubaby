CREATE TABLE `spark_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('topup','consume','bonus','refund') NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL,
	`description` varchar(255),
	`stripeSessionId` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spark_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` DROP INDEX `subscriptions_userId_unique`;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `plan` enum('free','pro','enterprise') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('active','canceled','incomplete','incomplete_expired','past_due','trialing','unpaid','paused') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `stripeCustomerId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `currentPeriodStart` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `currentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancelAtPeriodEnd` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `sparkBalance` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`);--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `startDate`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `endDate`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `cancelledAt`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `cancelReason`;