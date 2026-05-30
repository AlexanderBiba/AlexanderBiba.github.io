/**
 * Fetch the Open Graph (or Twitter) image URL for a given page.
 *
 * Used to illustrate projects that don't have an image set in the Studio:
 * we fall back to the og:image of the project's linked site.
 *
 * Returns an absolute image URL, or null if none could be found / fetched.
 */

function extractMetaContent(html: string, key: string): string | null {
  // Match <meta property="og:image" content="..."> in either attribute order,
  // using property= or name= and single or double quotes.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
      'i'
    ),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AlexBibaBot/1.0; +https://alexbiba.com)',
      },
      // Cache the fetched HTML for a week between revalidations.
      next: { revalidate: 60 * 60 * 24 * 7 },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null

    const html = await res.text()
    const og =
      extractMetaContent(html, 'og:image') ||
      extractMetaContent(html, 'twitter:image') ||
      extractMetaContent(html, 'twitter:image:src')

    if (!og) return null

    // Resolve protocol-relative and relative image URLs against the page URL.
    return new URL(og, url).toString()
  } catch {
    // Network error, timeout, invalid URL, etc. — just skip the fallback.
    return null
  }
}
