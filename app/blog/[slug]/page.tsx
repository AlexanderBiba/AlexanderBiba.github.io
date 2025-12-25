import { getPostBySlug, getAllPosts } from '../../../src/lib/sanity'
import BlogPost from '../../../src/components/BlogPost'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { generateBlogPostingSchema } from '../../../src/lib/seo'

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
  const ogImage = (typeof post.ogImage === 'object' && post.ogImage !== null ? post.ogImage.url : post.ogImage) || '/avatar.png'
  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `https://alexbiba.com${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`
  const postUrl = `https://alexbiba.com/blog/${post.slug}/`
  
  // Format date for article metadata (ISO 8601)
  const publishedDate = new Date(post.date).toISOString()

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
      publishedTime: publishedDate,
      modifiedTime: publishedDate,
      authors: ['Alex Biba'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Alex Biba`,
      description,
      images: [ogImageUrl],
    },
    other: {
      'article:author': 'Alex Biba',
      'article:published_time': publishedDate,
      'article:modified_time': publishedDate,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    notFound()
  }

  const schema = generateBlogPostingSchema(post)

  return (
    <>
      <Script
        id="blog-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BlogPost post={post} />
    </>
  )
}

