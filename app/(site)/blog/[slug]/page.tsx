import { getPostBySlug, getAllPosts, getSiteSettings } from '../../../../src/lib/sanity'
import BlogPost from '../../../../src/components/BlogPost'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { generateBlogPostingSchema } from '../../../../src/lib/seo'
import { extractDescription } from '../../../../src/lib/description'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])

  if (!post) {
    return {
      title: settings ? `Post Not Found | ${settings.name}` : 'Post Not Found',
    }
  }

  const description = extractDescription(post.content)
  const ogImage =
    (typeof post.ogImage === 'object' && post.ogImage !== null ? post.ogImage.url : post.ogImage) ||
    '/avatar.png'
  const ogImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `https://alexbiba.com${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`
  const postUrl = `https://alexbiba.com/blog/${post.slug}/`
  const publishedDate = new Date(post.date).toISOString()

  const baseMetadata: Metadata = {
    title: settings ? `${post.title} | ${settings.name}` : post.title,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: settings ? `${post.title} | ${settings.name}` : post.title,
      description,
      url: postUrl,
      type: 'article',
      images: [ogImageUrl],
      publishedTime: publishedDate,
      modifiedTime: publishedDate,
      ...(settings && { authors: [settings.name] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: settings ? `${post.title} | ${settings.name}` : post.title,
      description,
      images: [ogImageUrl],
    },
  }

  if (settings) {
    baseMetadata.other = {
      'article:author': settings.name,
      'article:published_time': publishedDate,
      'article:modified_time': publishedDate,
    }
  }

  return baseMetadata
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])

  if (!post) {
    notFound()
  }

  const schema = generateBlogPostingSchema(post, settings)

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



