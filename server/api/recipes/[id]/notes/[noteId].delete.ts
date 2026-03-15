import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { notes } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const noteId = parseInt(getRouterParam(event, 'noteId') ?? '')
  if (isNaN(noteId)) throw createError({ statusCode: 400, message: 'Invalid noteId' })

  const deleted = await db.delete(notes).where(eq(notes.id, noteId)).returning({ id: notes.id })
  if (!deleted.length) throw createError({ statusCode: 404, message: 'Note not found' })

  return { success: true }
})
