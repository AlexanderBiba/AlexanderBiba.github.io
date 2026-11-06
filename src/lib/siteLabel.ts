// "https://www.glossdocs.com/" -> "glossdocs.com", "https://alexanderbiba.github.io/wordle/" -> "alexanderbiba.github.io/wordle"
export function siteLabel(url: string): string {
  try {
    const { hostname, pathname } = new URL(url)
    return `${hostname.replace(/^www\./, '')}${pathname.replace(/\/+$/, '')}`
  } catch {
    return url
  }
}
