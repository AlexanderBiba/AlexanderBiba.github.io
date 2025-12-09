import { getAllPosts } from '../../src/posts/posts'
import BlogList from '../../src/components/BlogList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Alex Biba',
  description: 'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
  openGraph: {
    title: 'Blog | Alex Biba',
    description: 'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
    url: 'https://alexanderbiba.github.io/blog',
    type: 'website',
  },
}

export default function BlogPage() {
  return <BlogList />
}

