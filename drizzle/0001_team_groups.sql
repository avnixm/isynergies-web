-- Phase 1: Team groups data model
-- Adds team_groups table and groupId, groupOrder, isFeatured to team_members.

CREATE TABLE IF NOT EXISTS `team_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`display_order` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_groups_display_order_unique` UNIQUE(`display_order`)
);
--> statement-breakpoint
ALTER TABLE `team_members` ADD COLUMN `group_id` int;
--> statement-breakpoint
ALTER TABLE `team_members` ADD COLUMN `group_order` int;
--> statement-breakpoint
ALTER TABLE `team_members` ADD COLUMN `is_featured` boolean NOT NULL DEFAULT false;
