ALTER TABLE `domain_orders` ADD `dnsStatus` enum('pending','configuring','propagating','active','error') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `sslStatus` enum('pending','provisioning','active','error') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `cloudflareZoneId` varchar(64);--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `cloudflareCnameRecordId` varchar(64);--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `nameservers` text;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `targetHost` varchar(255) DEFAULT 'lulubaby.manus.space';--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `lastDnsCheck` timestamp;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `lastSslCheck` timestamp;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `dnsErrorMessage` text;--> statement-breakpoint
ALTER TABLE `domain_orders` ADD `sslErrorMessage` text;