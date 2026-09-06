import { Metadata } from 'next'
import { extractDescription } from './description'
import { SiteSettings } from '../types/blog'

interface GenerateContentMetadataProps {
  content: string
  date: string
  slug: string
  image?: string | { url: string } | null
  settings?: SiteSettings | null
  baseRoute: 'blog' | 'projects'
}

export function generateContentMetadata({
  content,
  date,
  slug,
  image,
  settings,
  baseRoute,
}: GenerateContentMetadataProps): Metadata {
  const authorName = settings?.name || 'Alex Biba'
  const description = extractDescription(content)
  const pageUrl = `https://alexbiba.com/${baseRoute}/${slug}/`
  const publishedDate = new Date(date).toISOString()

  // Handle image URL
  const ogImage = (typeof image === 'object' && image !== null ? image.url : image) || '/avatar.png'
  const ogImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `https://alexbiba.com${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`

  return {
    title: authorName,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: authorName,
      description,
      url: pageUrl,
      type: 'article',
      images: [ogImageUrl],
      publishedTime: publishedDate,
      modifiedTime: publishedDate,
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: authorName,
      description,
      images: [ogImageUrl],
    },
    other: {
      'article:author': authorName,
      'article:published_time': publishedDate,
      'article:modified_time': publishedDate,
    },
  }
}

export function generateNotFoundMetadata(
  settings?: SiteSettings | null
): Metadata {
  return {
    title: settings?.name || 'Alex Biba',
  }
}

