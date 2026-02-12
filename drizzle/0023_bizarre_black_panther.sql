ALTER TABLE `users` ADD `subdomain` varchar(63);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_subdomain_unique` UNIQUE(`subdomain`);