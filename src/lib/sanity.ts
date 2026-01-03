import { client, isSanityConfigured } from '../../sanity/lib/client'
import {
  blogPostQuery,
  allBlogPostsQuery,
  latestBlogPostsQuery,
  siteSettingsQuery,
} from '../../sanity/lib/queries'
import { BlogPost, SiteSettings } from '../types/blog'

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

