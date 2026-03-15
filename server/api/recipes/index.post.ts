import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { recipes } from '../../db/schema'
import { scrapeUrl, parseSchemaOrg, htmlToText } from '../../utils/scraper'
import { extractWithClaude } from '../../utils/claude'
import { extractFromSchemaOrg } from '../../utils/schemaOrg'
import { getYouTubeVideoId, getYouTubeMetadata, getYouTubeTranscript } from '../../utils/youtube'
import { hydrateRecipe } from '../../utils/recipeHelpers'
import type { ExtractedRecipe } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body ?? {}

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  let parsedUrl: URL
  try { parsedUrl = new URL(url.trim()) }
  catch { throw createError({ statusCode: 400, message: 'Invalid URL' }) }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw createError({ statusCode: 400, message: 'URL must use http or https' })
  }

  // Check for duplicates
  const existing = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.url, parsedUrl.href))
    .limit(1)

  if (existing.length > 0) {
    throw createError({ statusCode: 409, message: 'Recipe already saved', data: { id: existing[0].id } })
  }

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const videoId   = getYouTubeVideoId(parsedUrl.href)

  let extracted: ExtractedRecipe
  let extractionSource: string
  let finalUrl  = parsedUrl.href
  let rawJson: string | null = null

  if (videoId) {
    // ── YouTube ───────────────────────────────────────────────────────────────
    finalUrl = `https://www.youtube.com/watch?v=${videoId}`
    const metadata = await getYouTubeMetadata(videoId)

    if (hasApiKey) {
      const transcript = await getYouTubeTranscript(videoId)
      const context = transcript
        ? `YouTube video: "${metadata.title}" by ${metadata.author_name}\n\nTranscript:\n${transcript.slice(0, 80_000)}`
        : `YouTube video: "${metadata.title}" by ${metadata.author_name}\n\n(No transcript available — extract what you can from the title alone.)`

      extracted = await extractWithClaude('', null, context)
      extracted.title       = extracted.title || metadata.title
      extracted.image_url   = extracted.image_url || metadata.thumbnail_url
      extracted.source_name = metadata.author_name
      extractionSource = transcript ? 'youtube_transcript+claude' : 'youtube_title+claude'
    } else {
      // No API key — save as a video bookmark
      extracted = {
        title: metadata.title, description: null,
        image_url: metadata.thumbnail_url, source_name: metadata.author_name,
        cuisine: null, meal_type: null, difficulty: null,
        cook_time_minutes: null, prep_time_minutes: null, servings: null,
        tags: ['video'], ingredients: [], instructions: [],
      }
      extractionSource = 'youtube_oembed'
    }
  } else {
    // ── Regular URL ───────────────────────────────────────────────────────────
    const { html, finalUrl: scrapedUrl } = await scrapeUrl(parsedUrl.href)
    finalUrl = scrapedUrl

    const { structured, rawJson: rj } = parseSchemaOrg(html)
    rawJson = rj

    if (hasApiKey) {
      extracted = await extractWithClaude(html, structured, htmlToText(html))
      extractionSource = structured ? 'schema_org+claude' : 'claude'
    } else if (structured) {
      extracted = extractFromSchemaOrg(structured, finalUrl)
      extractionSource = 'schema_org'
      if (!extracted.ingredients.length) {
        throw createError({
          statusCode: 422,
          message: 'No recipe data found at that URL. Add an ANTHROPIC_API_KEY to enable AI extraction for any site.',
          data: { code: 'RECIPE_NOT_FOUND' },
        })
      }
    } else {
      throw createError({
        statusCode: 422,
        message: 'No structured recipe data found. Add an ANTHROPIC_API_KEY to enable AI extraction for any site.',
        data: { code: 'NO_API_KEY' },
      })
    }
  }

  const inserted = await db.insert(recipes).values({
    url:               finalUrl,
    source_name:       extracted.source_name,
    title:             extracted.title,
    description:       extracted.description,
    image_url:         extracted.image_url,
    cuisine:           extracted.cuisine,
    meal_type:         extracted.meal_type,
    difficulty:        extracted.difficulty,
    prep_time_minutes: extracted.prep_time_minutes,
    cook_time_minutes: extracted.cook_time_minutes,
    servings:          extracted.servings,
    tags:              JSON.stringify(extracted.tags ?? []),
    ingredients:       JSON.stringify(extracted.ingredients ?? []),
    instructions:      JSON.stringify(extracted.instructions ?? []),
    extraction_source: extractionSource,
    raw_schema_json:   rawJson,
  }).returning()

  return { success: true, recipe: hydrateRecipe(inserted[0]) }
})
