import BlogList from '../../../src/components/BlogList'
import { Metadata } from 'next'
import { getAllPosts, getSiteSettings } from '../../../src/lib/sanity'
import Script from 'next/script'
import { generateCollectionPageSchema } from '../../../src/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings ? `Writing | ${settings.name}` : 'Writing'
  const description = 'Writing about software and other projects.'

  return {
    title,
    description,
    alternates: {
      canonical: 'https://alexbiba.com/blog/',
    },
    openGraph: {
      title,
      description,
      url: 'https://alexbiba.com/blog/',
      type: 'website',
      images: ['/avatar.png'],
      ...(settings && { siteName: settings.name }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/avatar.png'],
    },
  }
}

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([getAllPosts(), getSiteSettings()])
  const schema = generateCollectionPageSchema(settings)

  return (
    <>
      {schema && (
        <Script
          id="collection-page-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <BlogList posts={posts} />
    </>
  )
}



