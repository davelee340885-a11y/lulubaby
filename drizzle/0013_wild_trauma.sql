ALTER TABLE `ai_personas` ADD `backgroundType` enum('none','color','image') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_personas` ADD `backgroundColor` varchar(20);