ALTER TABLE `knowledge_bases` MODIFY COLUMN `fileUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `knowledge_bases` MODIFY COLUMN `fileKey` varchar(512);--> statement-breakpoint
ALTER TABLE `knowledge_bases` ADD `sourceType` enum('file','youtube','webpage','text','faq') DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE `knowledge_bases` ADD `sourceUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `knowledge_bases` ADD `sourceMeta` text;