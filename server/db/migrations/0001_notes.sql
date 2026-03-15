CREATE TABLE IF NOT EXISTS `notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `recipe_id` integer NOT NULL REFERENCES `recipes`(`id`) ON DELETE CASCADE,
  `content` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
