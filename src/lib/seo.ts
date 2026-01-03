import { SiteSettings } from '../types/blog'

export function generatePersonSchema(settings?: SiteSettings | null) {
  if (!settings) return null

  const sameAs = [
    settings.github,
    settings.linkedin,
    settings.twitter,
  ].filter(Boolean) as string[]

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.name,
    jobTitle: 'Senior Software Engineer',
    description: settings.aboutBlurb,
    url: 'https://alexbiba.com',
    ...(sameAs.length > 0 && { sameAs }),
  }
}

import { extractDescription } from './description'

export function generateContentSchema(
  content: {
    title: string
    content: string
    date: string
    slug: string
    image?: string | { url: string } | null
  },
  settings: SiteSettings | null,
  baseRoute: 'blog' | 'portfolio'
) {
  const baseUrl = 'https://alexbiba.com'
  const contentUrl = `${baseUrl}/${baseRoute}/${content.slug}/`
  const publishedDate = new Date(content.date).toISOString()

  // Get image URL
  let imageUrl = `${baseUrl}/avatar.png`
  if (content.image) {
    const img = typeof content.image === 'string' ? content.image : content.image.url
    imageUrl = img.startsWith('http') ? img : `${baseUrl}${img.startsWith('/') ? img : `/${img}`}`
  }

  const description = extractDescription(content.content)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: content.title,
    description: description || content.title,
    image: imageUrl,
    datePublished: publishedDate,
    dateModified: publishedDate,
    ...(settings && {
      author: {
        '@type': 'Person',
        name: settings.name,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Person',
        name: settings.name,
        url: baseUrl,
      },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': contentUrl,
    },
    url: contentUrl,
  }
}

// Alias for backwards compatibility
export const generateBlogPostingSchema = (
  post: { title: string; content: string; date: string; slug: string; ogImage?: string | { url: string } | null },
  settings?: SiteSettings | null
) => generateContentSchema({ ...post, image: post.ogImage }, settings ?? null, 'blog')

export function generateCollectionPageSchema(
  settings: SiteSettings | null,
  type: 'blog' | 'portfolio' = 'blog'
) {
  if (!settings) return null

  const config = {
    blog: {
      name: `Writing | ${settings.name}`,
      description:
        'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
      url: 'https://alexbiba.com/blog/',
    },
    portfolio: {
      name: `Portfolio | ${settings.name}`,
      description: 'A showcase of projects I\'ve built and worked on.',
      url: 'https://alexbiba.com/portfolio/',
    },
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    ...config[type],
  }
}

