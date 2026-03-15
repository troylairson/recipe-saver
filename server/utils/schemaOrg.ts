import type { ExtractedRecipe } from '../db/schema'

// Parse ISO 8601 duration (e.g. "PT1H30M", "PT45M") → minutes
function parseDuration(iso: string | null | undefined): number | null {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  const hours = parseInt(match[1] ?? '0')
  const minutes = parseInt(match[2] ?? '0')
  const total = hours * 60 + minutes
  return total > 0 ? total : null
}

// Parse servings from strings like "4", "4 servings", "Makes 4"
function parseServings(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return raw > 0 ? raw : null
  const match = String(raw).match(/\d+/)
  return match ? parseInt(match[0]) : null
}

// Flatten recipeInstructions which can be strings, HowToStep, or HowToSection
function parseInstructions(raw: unknown): string[] {
  if (!raw) return []
  if (typeof raw === 'string') return [raw].filter(Boolean)
  if (!Array.isArray(raw)) return []

  const steps: string[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      steps.push(item)
    } else if (item?.['@type'] === 'HowToStep') {
      steps.push(item.text ?? item.name ?? '')
    } else if (item?.['@type'] === 'HowToSection') {
      // Section contains its own itemListElement
      const sub = parseInstructions(item.itemListElement)
      steps.push(...sub)
    }
  }
  return steps.filter(Boolean)
}

// Pull first usable image URL from various schema.org image formats
function parseImageUrl(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = parseImageUrl(item)
      if (url) return url
    }
  }
  if (typeof raw === 'object' && (raw as any).url) return (raw as any).url
  return null
}

// Infer difficulty from total cook+prep time
function inferDifficulty(cookMin: number | null, prepMin: number | null): 'easy' | 'medium' | 'hard' | null {
  const total = (cookMin ?? 0) + (prepMin ?? 0)
  if (total === 0) return null
  if (total <= 30) return 'easy'
  if (total <= 90) return 'medium'
  return 'hard'
}

// Map schema.org recipeCategory to our meal_type enum
function inferMealType(category: string | string[] | null | undefined): ExtractedRecipe['meal_type'] {
  const cats = (Array.isArray(category) ? category : [category ?? ''])
    .join(' ')
    .toLowerCase()

  if (/breakfast|brunch|morning/.test(cats)) return 'breakfast'
  if (/lunch/.test(cats)) return 'lunch'
  if (/dinner|main course|main dish|entrée|entree|supper/.test(cats)) return 'dinner'
  if (/dessert|cake|cookie|pie|pastry|sweet|baking/.test(cats)) return 'dessert'
  if (/snack|appetizer|starter|side/.test(cats)) return 'snack'
  if (cats.trim()) return 'other'
  return null
}

// Parse tags from keywords (can be comma-separated string or array)
function parseTags(keywords: unknown): string[] {
  if (!keywords) return []
  const raw = Array.isArray(keywords) ? keywords.join(',') : String(keywords)
  return raw.split(/[,;]+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0 && t.length < 40)
}

export function extractFromSchemaOrg(
  data: Record<string, unknown>,
  pageUrl: string,
): ExtractedRecipe {
  const cookMin  = parseDuration(data.cookTime as string)
  const prepMin  = parseDuration(data.prepTime as string)

  // Derive source name from author or URL hostname
  const author = (data.author as any)?.name ?? data.author
  const sourceName = typeof author === 'string' && author
    ? author
    : new URL(pageUrl).hostname.replace(/^www\./, '')

  return {
    title:             String(data.name ?? 'Untitled Recipe'),
    description:       typeof data.description === 'string' ? data.description : null,
    image_url:         parseImageUrl(data.image),
    source_name:       sourceName,
    cuisine:           Array.isArray(data.recipeCuisine)
                         ? (data.recipeCuisine as string[])[0] ?? null
                         : (data.recipeCuisine as string) ?? null,
    meal_type:         inferMealType(data.recipeCategory as string | string[]),
    difficulty:        inferDifficulty(cookMin, prepMin),
    cook_time_minutes: cookMin,
    prep_time_minutes: prepMin,
    servings:          parseServings(data.recipeYield as string | number),
    tags:              parseTags(data.keywords),
    ingredients:       Array.isArray(data.recipeIngredient)
                         ? (data.recipeIngredient as string[]).filter(Boolean)
                         : [],
    instructions:      parseInstructions(data.recipeInstructions),
  }
}
