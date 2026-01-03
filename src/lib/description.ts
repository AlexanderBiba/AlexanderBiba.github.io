/**
 * Extract a clean description from markdown content
 * @param content - Markdown content
 * @param maxLength - Maximum length of the description (default: 160)
 * @returns Cleaned description string
 */
export function extractDescription(content: string, maxLength: number = 160): string {
  if (!content) return ''
  
  // Remove markdown headers, links, and other formatting
  let cleaned = content
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove links but keep text: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove bold/italic
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove extra whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim()
  
  // Truncate to maxLength and add ellipsis if needed
  if (cleaned.length > maxLength) {
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = cleaned.lastIndexOf(' ', maxLength)
    const cutoff = lastSpace > 0 ? lastSpace : maxLength
    return cleaned.substring(0, cutoff).trim() + '...'
  }
  
  return cleaned
}

