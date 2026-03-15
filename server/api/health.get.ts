export default defineEventHandler(() => {
  return { ok: true, time: new Date().toISOString() }
})
