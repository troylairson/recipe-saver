import { parse } from 'node-html-parser'

const TIMEOUT_MS = 15_000
const MAX_HTML_CHARS = 500_000

export async function scrapeUrl(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw createError({ statusCode: 422, message: `HTTP ${response.status} from that URL`, data: { code: 'SCRAPE_HTTP_ERROR' } })
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      throw createError({ statusCode: 422, message: 'URL did not return an HTML page', data: { code: 'NOT_HTML' } })
    }

    const rawHtml = await response.text()
    return {
      html:     rawHtml.slice(0, MAX_HTML_CHARS),
      finalUrl: response.url,
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw createError({ statusCode: 422, message: 'That site took too long to respond', data: { code: 'SCRAPE_TIMEOUT' } })
    }
    // Re-throw H3 errors as-is
    if (err.statusCode) throw err
    throw createError({ statusCode: 422, message: `Could not fetch URL: ${err.message}`, data: { code: 'SCRAPE_HTTP_ERROR' } })
  } finally {
    clearTimeout(timer)
  }
}

export function parseSchemaOrg(html: string): {
  structured: Record<string, unknown> | null
  rawJson: string | null
} {
  try {
    const root = parse(html)
    const scriptTags = root.querySelectorAll('script[type="application/ld+json"]')

    for (const tag of scriptTags) {
      try {
        const data = JSON.parse(tag.text)
        const candidates = Array.isArray(data)
          ? data
          : data?.['@graph']
            ? data['@graph']
            : [data]

        const recipeNode = candidates.find((n: any) =>
          n?.['@type'] === 'Recipe' ||
          (Array.isArray(n?.['@type']) && n['@type'].includes('Recipe'))
        )

        if (recipeNode) {
          return { structured: recipeNode, rawJson: JSON.stringify(recipeNode) }
        }
      } catch {
        // malformed JSON-LD, skip
      }
    }
  } catch {
    // parse failure, return null
  }

  return { structured: null, rawJson: null }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 80_000)
}
