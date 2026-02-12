CREATE TABLE `widget_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`widgetEnabled` boolean NOT NULL DEFAULT true,
	`position` varchar(20) NOT NULL DEFAULT 'bottom-right',
	`size` varchar(20) NOT NULL DEFAULT 'medium',
	`bubbleSize` int NOT NULL DEFAULT 60,
	`showBubbleText` boolean NOT NULL DEFAULT true,
	`bubbleText` varchar(50) DEFAULT '需要幫助嗎？',
	`autoOpen` boolean NOT NULL DEFAULT false,
	`autoOpenDelay` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `widget_settings_personaId_unique` UNIQUE(`personaId`)
);
