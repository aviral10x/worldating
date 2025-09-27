ALTER TABLE `users` ADD `world_address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `world_username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_world_address_unique` ON `users` (`world_address`);