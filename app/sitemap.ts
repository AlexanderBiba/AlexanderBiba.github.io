import { MetadataRoute } from 'next'
import { getAllPosts, getAllProjects } from '../src/lib/sanity'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alexbiba.com'
  
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
    {
      url: `${baseUrl}/portfolio/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
  
  // Get all blog posts and portfolio projects (returns empty arrays if Sanity is not configured)
  const [posts, projects] = await Promise.all([getAllPosts(), getAllProjects()])
  
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
  
  // Portfolio project pages
  const portfolioPages: MetadataRoute.Sitemap = projects.map((project) => {
    const projectDate = new Date(project.date)
    return {
      url: `${baseUrl}/portfolio/${project.slug}/`,
      lastModified: projectDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  })
  
  return [...staticPages, ...blogPages, ...portfolioPages]
}

