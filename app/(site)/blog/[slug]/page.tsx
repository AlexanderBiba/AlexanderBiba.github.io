import { getPostBySlug, getAllPosts, getSiteSettings } from '../../../../src/lib/content'
import BlogPost from '../../../../src/components/BlogPost'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { generateContentSchema } from '../../../../src/lib/seo'
import { generateContentMetadata, generateNotFoundMetadata } from '../../../../src/lib/metadata'

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

  if (!post) return generateNotFoundMetadata(settings)

  return generateContentMetadata({
    content: post.content,
    date: post.date,
    slug: post.slug,
    image: post.ogImage,
    settings,
    baseRoute: 'blog',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])

  if (!post) {
    notFound()
  }

  const schema = generateContentSchema({ ...post, image: post.ogImage }, settings, 'blog')

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



