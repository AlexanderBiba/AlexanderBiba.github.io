import { getPostBySlug, getAllPosts } from '../../../src/posts/posts'
import BlogPost from '../../../src/components/BlogPost'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Alex Biba',
    }
  }

  const description = post.description || post.content.substring(0, 160).replace(/\n/g, ' ').trim() + '...'
  const ogImage = post.ogImage || '/preview.png'
  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `https://alexanderbiba.github.io${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`
  const postUrl = `https://alexanderbiba.github.io/blog/${post.slug}`

  return {
    title: `${post.title} | Alex Biba`,
    description,
    openGraph: {
      title: `${post.title} | Alex Biba`,
      description,
      url: postUrl,
      type: 'article',
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Alex Biba`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  
  if (!post) {
    notFound()
  }

  return <BlogPost post={post} />
}

