CREATE TABLE IF NOT EXISTS `recipes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `url` text NOT NULL UNIQUE,
  `source_name` text,
  `title` text NOT NULL,
  `description` text,
  `image_url` text,
  `cuisine` text,
  `meal_type` text,
  `difficulty` text,
  `prep_time_minutes` integer,
  `cook_time_minutes` integer,
  `servings` integer,
  `tags` text DEFAULT '[]',
  `ingredients` text NOT NULL DEFAULT '[]',
  `instructions` text NOT NULL DEFAULT '[]',
  `extraction_source` text,
  `raw_schema_json` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

-- FTS5 virtual table for full-text search on title, description, cuisine, tags
CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
  title,
  description,
  cuisine,
  tags,
  content='recipes',
  content_rowid='id'
);

-- Keep FTS in sync on insert
CREATE TRIGGER IF NOT EXISTS recipes_ai AFTER INSERT ON recipes BEGIN
  INSERT INTO recipes_fts(rowid, title, description, cuisine, tags)
  VALUES (new.id, new.title, new.description, new.cuisine, new.tags);
END;

-- Keep FTS in sync on update
CREATE TRIGGER IF NOT EXISTS recipes_au AFTER UPDATE ON recipes BEGIN
  INSERT INTO recipes_fts(recipes_fts, rowid, title, description, cuisine, tags)
  VALUES('delete', old.id, old.title, old.description, old.cuisine, old.tags);
  INSERT INTO recipes_fts(rowid, title, description, cuisine, tags)
  VALUES (new.id, new.title, new.description, new.cuisine, new.tags);
END;

-- Keep FTS in sync on delete
CREATE TRIGGER IF NOT EXISTS recipes_ad AFTER DELETE ON recipes BEGIN
  INSERT INTO recipes_fts(recipes_fts, rowid, title, description, cuisine, tags)
  VALUES('delete', old.id, old.title, old.description, old.cuisine, old.tags);
END;
