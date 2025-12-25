import { getPostBySlug, getAllPosts } from '../../../src/lib/sanity'
import BlogPost from '../../../src/components/BlogPost'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Alex Biba',
    }
  }

  const description = post.description || post.content.substring(0, 160).replace(/\n/g, ' ').trim() + '...'
  const ogImage = (typeof post.ogImage === 'object' && post.ogImage !== null ? post.ogImage.url : post.ogImage) || '/preview.png'
  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `https://alexanderbiba.github.io${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`
  const postUrl = `https://alexanderbiba.github.io/blog/${post.slug}`

  return {
    title: `${post.title} | Alex Biba`,
    description,
    alternates: {
      canonical: postUrl,
    },
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    notFound()
  }

  return <BlogPost post={post} />
}

