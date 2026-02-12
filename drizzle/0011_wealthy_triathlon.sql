ALTER TABLE `domain_orders` ADD `personaId` int;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `isPublished` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `publishedAt` timestamp;