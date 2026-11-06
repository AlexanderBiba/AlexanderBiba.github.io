import { getWorkBySlug, getAllWorks, getSiteSettings } from '../../../../src/lib/content'
import WorkPage from '../../../../src/components/WorkPage'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { generateContentSchema } from '../../../../src/lib/seo'
import { generateContentMetadata, generateNotFoundMetadata } from '../../../../src/lib/metadata'

export async function generateStaticParams() {
  const works = await getAllWorks()
  return works.map((work) => ({ slug: work.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [work, settings] = await Promise.all([getWorkBySlug(slug), getSiteSettings()])

  if (!work) return generateNotFoundMetadata(settings)

  return generateContentMetadata({
    content: work.content,
    date: work.date,
    slug: work.slug,
    image: work.image,
    settings,
    baseRoute: 'works',
  })
}

export default async function WorkRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [work, settings] = await Promise.all([getWorkBySlug(slug), getSiteSettings()])

  if (!work) notFound()

  const schema = generateContentSchema(work, settings, 'works')

  return (
    <>
      <Script
        id="work-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <WorkPage work={work} />
    </>
  )
}
