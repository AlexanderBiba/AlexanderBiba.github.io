import { MetadataRoute } from 'next'
import { getAllPosts } from '../src/lib/sanity'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alexanderbiba.github.io'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
  
  // Get all blog posts (returns empty array if Sanity is not configured)
  const posts = await getAllPosts()
  
  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const postDate = new Date(post.date)
    return {
      url: `${baseUrl}/blog/${post.slug}/`,
      lastModified: postDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })
  
  return [...staticPages, ...blogPages]
}

