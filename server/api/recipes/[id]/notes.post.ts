import { db } from '../../../db'
import { notes } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { content } = await readBody(event)
  if (!content?.trim()) throw createError({ statusCode: 400, message: 'content is required' })

  const inserted = await db.insert(notes).values({ recipe_id: id, content: content.trim() }).returning()
  return inserted[0]
})
