CREATE TABLE `customer_conversation_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`summary` text NOT NULL,
	`keyTopics` text,
	`questionsAsked` text,
	`messageCount` int NOT NULL DEFAULT 0,
	`duration` int,
	`outcome` enum('resolved','pending','escalated','converted','abandoned') DEFAULT 'pending',
	`conversationDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_conversation_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`memoryType` enum('preference','fact','need','concern','interaction','purchase','feedback','custom') NOT NULL DEFAULT 'fact',
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`confidence` int NOT NULL DEFAULT 80,
	`sourceConversationId` int,
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`fingerprint` varchar(128),
	`name` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`company` varchar(200),
	`title` varchar(100),
	`preferredLanguage` varchar(20) DEFAULT 'zh-TW',
	`tags` text,
	`notes` text,
	`totalConversations` int NOT NULL DEFAULT 0,
	`totalMessages` int NOT NULL DEFAULT 0,
	`lastVisitAt` timestamp,
	`firstVisitAt` timestamp NOT NULL DEFAULT (now()),
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
