import { MetadataRoute } from 'next'
import { getAllPosts } from '../src/lib/sanity'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alexanderbiba.github.io'
  
  // Get all blog posts
  const posts = await getAllPosts()
  
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

