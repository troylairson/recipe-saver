import { YoutubeTranscript } from 'youtube-transcript'

export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {}
  return null
}

export async function getYouTubeMetadata(videoId: string): Promise<{
  title: string
  thumbnail_url: string
  author_name: string
}> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
  )
  if (!res.ok) throw createError({ statusCode: 422, message: 'Could not fetch YouTube video info', data: { code: 'SCRAPE_HTTP_ERROR' } })
  return res.json()
}

export async function getYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId)
    return segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim()
  } catch {
    return null
  }
}
