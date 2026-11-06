import WorkList from '../../../src/components/WorkList'
import { Metadata } from 'next'
import { getAllWorks, getSiteSettings } from '../../../src/lib/content'
import Script from 'next/script'
import { generateCollectionPageSchema } from '../../../src/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings?.name || 'Alex Biba'
  const description = 'Things I\'ve built and worked on.'

  return {
    title,
    description,
    alternates: {
      canonical: 'https://alexbiba.com/works/',
    },
    openGraph: {
      title,
      description,
      url: 'https://alexbiba.com/works/',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function WorksPage() {
  const [works, settings] = await Promise.all([getAllWorks(), getSiteSettings()])
  const schema = generateCollectionPageSchema(settings, 'works')

  return (
    <>
      {schema && (
        <Script
          id="works-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <WorkList works={works} />
    </>
  )
}
