import { eq, desc } from 'drizzle-orm'
import { db } from '../../../db'
import { notes } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  return db.select().from(notes).where(eq(notes.recipe_id, id)).orderBy(desc(notes.created_at))
})
