import { readFile } from 'node:fs/promises'
import path from 'node:path'
import posts from '../../content/blog.json'
import projects from '../../content/projects.json'
import settings from '../../content/site.json'
import type { BlogPost, PortfolioProject, SiteSettings } from '../types/blog'

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
export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  const project = projects.find(project => project.slug === slug)
  return project ? { ...project, content: await body('projects', project.slug) } : null
}
export async function getAllProjects(): Promise<PortfolioProject[]> {
  return Promise.all([...projects].sort((a, b) => b.date.localeCompare(a.date)).map(async project => ({ ...project, content: await body('projects', project.slug) })))
}
export async function getLatestProjects(limit = 3): Promise<PortfolioProject[]> {
  return (await getAllProjects()).slice(0, limit)
}
export async function getSiteSettings(): Promise<SiteSettings> { return settings }
