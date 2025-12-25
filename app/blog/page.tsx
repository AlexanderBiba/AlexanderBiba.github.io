import BlogList from '../../src/components/BlogList'
import { Metadata } from 'next'
import { getAllPosts } from '../../src/lib/sanity'

export const metadata: Metadata = {
  title: 'Blog | Alex Biba',
  description: 'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
  alternates: {
    canonical: 'https://alexanderbiba.github.io/blog/',
  },
  openGraph: {
    title: 'Blog | Alex Biba',
    description: 'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
    url: 'https://alexanderbiba.github.io/blog',
    type: 'website',
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()
  return <BlogList posts={posts} />
}

