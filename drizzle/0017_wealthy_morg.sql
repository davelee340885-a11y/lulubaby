CREATE TABLE `customer_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`passwordHash` varchar(255) NOT NULL,
	`personaId` int NOT NULL,
	`provider` enum('email','google','apple','microsoft') NOT NULL DEFAULT 'email',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_users_email_unique` UNIQUE(`email`)
);
