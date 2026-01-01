CREATE TABLE `team_knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`category` enum('company_info','products','services','history','faq','sales_scripts','case_studies','policies','training','other') NOT NULL DEFAULT 'other',
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`isShared` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_knowledge_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`knowledgeId` int NOT NULL,
	`memberId` int NOT NULL,
	`canAccess` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_knowledge_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`knowledgeAccess` enum('full','partial','none') NOT NULL DEFAULT 'full',
	`inviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'accepted',
	`inviteEmail` varchar(320),
	`inviteToken` varchar(64),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`logoUrl` varchar(512),
	`ownerId` int NOT NULL,
	`plan` enum('team_basic','team_pro','enterprise') NOT NULL DEFAULT 'team_basic',
	`maxMembers` int NOT NULL DEFAULT 5,
	`status` enum('active','suspended','cancelled') NOT NULL DEFAULT 'active',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
