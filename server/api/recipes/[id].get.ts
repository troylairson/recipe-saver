import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { recipes } from '../../db/schema'
import { hydrateRecipe } from '../../utils/recipeHelpers'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const rows = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
  if (rows.length === 0) throw createError({ statusCode: 404, message: 'Recipe not found' })

  return hydrateRecipe(rows[0])
})
