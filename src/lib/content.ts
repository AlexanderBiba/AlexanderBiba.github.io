import { readFile } from 'node:fs/promises'
import path from 'node:path'
import posts from '../../content/blog.json'
import works from '../../content/works.json'
import settings from '../../content/site.json'
import type { BlogPost, SiteSettings, Work } from '../types/blog'

// Slugs come only from the checked-in indexes, never directly from a request path.
async function body(folder: string, slug: string) {
  return readFile(path.join(process.cwd(), 'content', folder, `${slug}.md`), 'utf8')
}
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = posts.find(post => post.slug === slug)
  return post ? { ...post, content: await body('blog', post.slug) } : null
}
export async function getAllPosts(): Promise<BlogPost[]> {
  return Promise.all([...posts].sort((a, b) => b.date.localeCompare(a.date)).map(async post => ({ ...post, content: await body('blog', post.slug) })))
}
export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  return (await getAllPosts()).slice(0, limit)
}
export async function getWorkBySlug(slug: string): Promise<Work | null> {
  const work = works.find(work => work.slug === slug)
  return work ? { ...work, content: await body('works', work.slug) } : null
}
export async function getAllWorks(): Promise<Work[]> {
  return Promise.all([...works].sort((a, b) => b.date.localeCompare(a.date)).map(async work => ({ ...work, content: await body('works', work.slug) })))
}
export async function getLatestWorks(limit = 3): Promise<Work[]> {
  return (await getAllWorks()).slice(0, limit)
}
export async function getSiteSettings(): Promise<SiteSettings> { return settings }
