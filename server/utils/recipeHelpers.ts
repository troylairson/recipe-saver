import type { Recipe, RecipeRow } from '../db/schema'

export function hydrateRecipe(row: Recipe): RecipeRow {
  return {
    ...row,
    tags:         safeParseJson(row.tags, []),
    ingredients:  safeParseJson(row.ingredients, []),
    instructions: safeParseJson(row.instructions, []),
  }
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) }
  catch { return fallback }
}
