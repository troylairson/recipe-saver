import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { recipes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const deleted = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id })
  if (deleted.length === 0) throw createError({ statusCode: 404, message: 'Recipe not found' })

  return { success: true }
})
