import BlogList from '../../src/components/BlogList'
import { Metadata } from 'next'
import { getAllPosts } from '../../src/lib/sanity'
import Script from 'next/script'
import { generateCollectionPageSchema } from '../../src/lib/seo'

export const metadata: Metadata = {
  title: 'Writing | Alex Biba',
  description: 'Writing about software and other projects.',
  alternates: {
    canonical: 'https://alexanderbiba.github.io/blog/',
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()
  const schema = generateCollectionPageSchema()
  
  return (
    <>
      <Script
        id="collection-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BlogList posts={posts} />
    </>
  )
}

