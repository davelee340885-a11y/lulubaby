CREATE TABLE `learning_diaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`memoryType` enum('sales_experience','customer_insight','product_knowledge','objection_handling','success_case','market_trend','personal_note') NOT NULL DEFAULT 'sales_experience',
	`importance` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`tags` text,
	`relatedCustomer` varchar(255),
	`relatedProduct` varchar(255),
	`actionItems` text,
	`sourceType` enum('manual','auto_extracted','imported') NOT NULL DEFAULT 'manual',
	`sourceConversationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_diaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_embeddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diaryId` int NOT NULL,
	`keywords` text,
	`memoryType` enum('sales_experience','customer_insight','product_knowledge','objection_handling','success_case','market_trend','personal_note') NOT NULL DEFAULT 'sales_experience',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memory_embeddings_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_embeddings_diaryId_unique` UNIQUE(`diaryId`)
);
