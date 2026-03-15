import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedRecipe } from '../db/schema'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw createError({ statusCode: 503, message: 'AI extraction is not configured', data: { code: 'AI_UNAVAILABLE' } })
  return new Anthropic({ apiKey })
}

const RECIPE_SCHEMA = {
  type: 'object' as const,
  required: ['title', 'ingredients', 'instructions', 'tags'],
  properties: {
    title:             { type: 'string' },
    description:       { type: ['string', 'null'] },
    image_url:         { type: ['string', 'null'] },
    source_name:       { type: ['string', 'null'] },
    cuisine:           { type: ['string', 'null'] },
    meal_type:         { type: ['string', 'null'], enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other', null] },
    difficulty:        { type: ['string', 'null'], enum: ['easy', 'medium', 'hard', null] },
    cook_time_minutes: { type: ['integer', 'null'] },
    prep_time_minutes: { type: ['integer', 'null'] },
    servings:          { type: ['integer', 'null'] },
    tags:              { type: 'array', items: { type: 'string' } },
    ingredients:       { type: 'array', items: { type: 'string' } },
    instructions:      { type: 'array', items: { type: 'string' } },
  },
}

export async function extractWithClaude(
  html: string,
  schemaOrgData: Record<string, unknown> | null,
  pageText: string,
): Promise<ExtractedRecipe> {
  const client = getClient()
  const model = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6'

  const systemPrompt = `You are a recipe data extractor. Extract structured recipe information and return it using the save_recipe tool.
- For difficulty: infer from cook time, technique complexity, and number of steps (easy = simple techniques/under 30 min, hard = advanced techniques or over 2 hrs)
- For tags: generate 3-8 descriptive lowercase tags (e.g. "vegetarian", "quick", "one-pot", "gluten-free")
- For image_url: look for a prominent recipe image URL in the content
- For source_name: extract the website/publication name (e.g. "NYT Cooking", "Serious Eats")
- If a field cannot be determined, return null for optional fields or [] for arrays`

  const userContent = schemaOrgData
    ? `Schema.org Recipe data already parsed:\n${JSON.stringify(schemaOrgData, null, 2)}\n\nPage text for additional context:\n${pageText}`
    : `Extract the recipe from this page content:\n${pageText}`

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      tools: [{
        name: 'save_recipe',
        description: 'Save the extracted recipe data',
        input_schema: RECIPE_SCHEMA,
      }],
      tool_choice: { type: 'tool', name: 'save_recipe' },
    })

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (!toolUse) {
      throw createError({ statusCode: 422, message: 'Could not extract a recipe from that URL', data: { code: 'RECIPE_NOT_FOUND' } })
    }

    const extracted = toolUse.input as ExtractedRecipe

    if (!extracted.ingredients || extracted.ingredients.length === 0) {
      throw createError({ statusCode: 422, message: 'No recipe found at that URL', data: { code: 'RECIPE_NOT_FOUND' } })
    }

    return extracted
  } catch (err: any) {
    if (err.statusCode) throw err
    if (err instanceof Anthropic.APIError) {
      throw createError({ statusCode: 503, message: 'AI extraction is temporarily unavailable', data: { code: 'AI_UNAVAILABLE' } })
    }
    throw createError({ statusCode: 503, message: 'AI extraction failed', data: { code: 'AI_UNAVAILABLE' } })
  }
}
