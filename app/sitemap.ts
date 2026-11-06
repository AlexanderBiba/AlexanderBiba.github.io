import { MetadataRoute } from 'next'
import { getAllPosts, getAllWorks } from '../src/lib/content'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alexbiba.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/play/`, changeFrequency: 'monthly', priority: 0.8 },
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
    {
      url: `${baseUrl}/works/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${baseUrl}/privacy/`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  
  // Get all blog posts and works
  const [posts, works] = await Promise.all([getAllPosts(), getAllWorks()])
  
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
  
  // Work pages
  const workPages: MetadataRoute.Sitemap = works.map((work) => {
    const workDate = new Date(work.date)
    return {
      url: `${baseUrl}/works/${work.slug}/`,
      lastModified: workDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })

  return [...staticPages, ...blogPages, ...workPages]
}

