import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const recipes = sqliteTable('recipes', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  url:               text('url').notNull().unique(),
  source_name:       text('source_name'),
  title:             text('title').notNull(),
  description:       text('description'),
  image_url:         text('image_url'),
  cuisine:           text('cuisine'),
  meal_type:         text('meal_type'),      // breakfast|lunch|dinner|snack|dessert|other
  difficulty:        text('difficulty'),     // easy|medium|hard
  prep_time_minutes: integer('prep_time_minutes'),
  cook_time_minutes: integer('cook_time_minutes'),
  servings:          integer('servings'),
  tags:              text('tags').default('[]'),
  ingredients:       text('ingredients').notNull().default('[]'),
  instructions:      text('instructions').notNull().default('[]'),
  extraction_source: text('extraction_source'),
  raw_schema_json:   text('raw_schema_json'),
  created_at:        text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at:        text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const notes = sqliteTable('notes', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  recipe_id:  integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  content:    text('content').notNull(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export type Note = typeof notes.$inferSelect

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert

export interface RecipeRow extends Omit<Recipe, 'tags' | 'ingredients' | 'instructions'> {
  tags:         string[]
  ingredients:  string[]
  instructions: string[]
}

export interface ExtractedRecipe {
  title:             string
  description:       string | null
  image_url:         string | null
  cuisine:           string | null
  meal_type:         'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'other' | null
  difficulty:        'easy' | 'medium' | 'hard' | null
  cook_time_minutes: number | null
  prep_time_minutes: number | null
  servings:          number | null
  source_name:       string | null
  tags:              string[]
  ingredients:       string[]
  instructions:      string[]
}
