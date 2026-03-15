import { eq, desc, and, count, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '../../db'
import { recipes } from '../../db/schema'
import { hydrateRecipe } from '../../utils/recipeHelpers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    q,
    cuisine,
    meal_type,
    difficulty,
    limit  = '24',
    offset = '0',
  } = query as Record<string, string>

  const limitN  = Math.min(parseInt(limit) || 24, 100)
  const offsetN = parseInt(offset) || 0

  // Full-text search via FTS5
  if (q && q.trim()) {
    const ftsQuery = q.trim().replace(/["*']/g, '') + '*'

    let whereClause = `WHERE recipes_fts MATCH ?`
    const params: unknown[] = [ftsQuery]

    if (cuisine) { whereClause += ' AND r.cuisine = ?'; params.push(cuisine) }
    if (meal_type) { whereClause += ' AND r.meal_type = ?'; params.push(meal_type) }
    if (difficulty) { whereClause += ' AND r.difficulty = ?'; params.push(difficulty) }

    const result = await db.$client.execute({
      sql: `SELECT r.* FROM recipes r JOIN recipes_fts ON recipes_fts.rowid = r.id ${whereClause} ORDER BY rank LIMIT ? OFFSET ?`,
      args: [...params, limitN, offsetN],
    })

    const rows = result.rows as unknown as typeof recipes.$inferSelect[]
    return { recipes: rows.map(hydrateRecipe), total: rows.length }
  }

  // Plain filter query
  const conditions: SQL[] = []
  if (cuisine)    conditions.push(eq(recipes.cuisine, cuisine))
  if (meal_type)  conditions.push(eq(recipes.meal_type, meal_type))
  if (difficulty) conditions.push(eq(recipes.difficulty, difficulty))

  const where = conditions.length ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db.select().from(recipes)
      .where(where)
      .orderBy(desc(recipes.created_at))
      .limit(limitN)
      .offset(offsetN),
    db.select({ count: count() }).from(recipes).where(where),
  ])

  return { recipes: rows.map(hydrateRecipe), total: countResult[0].count }
})
