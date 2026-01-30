ALTER TABLE `customers` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `customers` ADD `isEmailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `emailVerificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `customers` ADD `emailVerificationExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `customers` ADD `passwordResetExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `customers` ADD `lastLoginAt` timestamp;