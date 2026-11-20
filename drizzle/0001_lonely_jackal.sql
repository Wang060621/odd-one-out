CREATE TABLE `voice_peers` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`player_id` text NOT NULL,
	`session_id` text NOT NULL,
	`muted` integer DEFAULT 1 NOT NULL,
	`heartbeat` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voice_peers_room` ON `voice_peers` (`room_code`);--> statement-breakpoint
CREATE TABLE `voice_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`room_code` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_session` text NOT NULL,
	`recipient_session` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_signals_message_id_unique` ON `voice_signals` (`message_id`);--> statement-breakpoint
CREATE INDEX `voice_signals_recipient` ON `voice_signals` (`room_code`,`recipient_session`,`id`);