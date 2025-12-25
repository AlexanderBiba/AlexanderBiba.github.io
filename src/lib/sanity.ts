import { client, isSanityConfigured } from '../../sanity/lib/client'
import {
  blogPostQuery,
  allBlogPostsQuery,
  latestBlogPostsQuery,
} from '../../sanity/lib/queries'
import { BlogPost } from '../posts/types'

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
    description: post.description || '',
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
    description: post.description || '',
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
    description: post.description || '',
    ogImage: post.ogImage?.asset || post.ogImage || null,
    content: post.content || '',
  }))
}

