ALTER TABLE `images` ADD COLUMN `upload_id` varchar(255);
--> statement-breakpoint
CREATE INDEX `images_upload_id_idx` ON `images` (`upload_id`);

