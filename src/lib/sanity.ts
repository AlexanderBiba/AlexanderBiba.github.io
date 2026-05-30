import { client, isSanityConfigured } from '../../sanity/lib/client'
import {
  blogPostQuery,
  allBlogPostsQuery,
  latestBlogPostsQuery,
  portfolioProjectQuery,
  allPortfolioProjectsQuery,
  siteSettingsQuery,
} from '../../sanity/lib/queries'
import { BlogPost, PortfolioProject, SiteSettings } from '../types/blog'
import { fetchOgImage } from './ogImage'

// Blog Post functions
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSanityConfigured() || !client) {
    return null
  }
  
  const post = await client.fetch(blogPostQuery, { slug })
  if (!post) return null
  
  return {
    slug: post.slug.current,
    title: post.title,
    date: post.date,
    ogImage: post.ogImage?.asset || post.ogImage || null,
    content: post.content || '',
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!isSanityConfigured() || !client) {
    return []
  }
  
  const posts = await client.fetch(allBlogPostsQuery)
  return posts.map((post: any) => ({
    slug: post.slug.current,
    title: post.title,
    date: post.date,
    ogImage: post.ogImage?.asset || post.ogImage || null,
    content: post.content || '',
  }))
}

export async function getLatestPosts(limit: number = 3): Promise<BlogPost[]> {
  if (!isSanityConfigured() || !client) {
    return []
  }
  
  const posts = await client.fetch(latestBlogPostsQuery, { limit })
  return posts.map((post: any) => ({
    slug: post.slug.current,
    title: post.title,
    date: post.date,
    ogImage: post.ogImage?.asset || post.ogImage || null,
    content: post.content || '',
  }))
}

// Portfolio Project functions
async function mapProject(project: any): Promise<PortfolioProject> {
  const image = project.image?.asset || project.image || null

  // When no image is set in the Studio, illustrate the project with the
  // og:image of its linked site (if it has a URL).
  let previewImage: string | null = null
  if (!image && project.url) {
    previewImage = await fetchOgImage(project.url)
  }

  return {
    slug: project.slug.current,
    title: project.title,
    date: project.date,
    image,
    url: project.url,
    content: project.content || '',
    previewImage,
  }
}

export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  if (!isSanityConfigured() || !client) {
    return null
  }

  const project = await client.fetch(portfolioProjectQuery, { slug })
  if (!project) return null

  return mapProject(project)
}

export async function getAllProjects(): Promise<PortfolioProject[]> {
  if (!isSanityConfigured() || !client) {
    return []
  }

  const projects = await client.fetch(allPortfolioProjectsQuery)
  return Promise.all(projects.map(mapProject))
}

export async function getLatestProjects(limit: number = 3): Promise<PortfolioProject[]> {
  const projects = await getAllProjects()
  return projects.slice(0, limit)
}

// Site Settings function
export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isSanityConfigured() || !client) {
    return null
  }
  
  const settings = await client.fetch(siteSettingsQuery)
  if (!settings) return null
  
  return {
    name: settings.name || '',
    aboutBlurb: settings.aboutBlurb || '',
    email: settings.email,
    github: settings.github,
    linkedin: settings.linkedin,
    twitter: settings.twitter,
    avatar: settings.avatar?.asset || null,
  }
}

