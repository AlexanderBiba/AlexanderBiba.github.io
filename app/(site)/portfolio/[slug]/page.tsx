import { getProjectBySlug, getAllProjects, getSiteSettings } from '../../../../src/lib/sanity'
import PortfolioProject from '../../../../src/components/PortfolioProject'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { generateContentSchema } from '../../../../src/lib/seo'
import { generateContentMetadata, generateNotFoundMetadata } from '../../../../src/lib/metadata'

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()])

  if (!project) return generateNotFoundMetadata('Project', settings)

  return generateContentMetadata({
    title: project.title,
    content: project.content,
    date: project.date,
    slug: project.slug,
    image: project.image,
    settings,
    baseRoute: 'portfolio',
  })
}

export default async function PortfolioProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()])

  if (!project) notFound()

  const schema = generateContentSchema(project, settings, 'portfolio')

  return (
    <>
      <Script
        id="portfolio-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PortfolioProject project={project} />
    </>
  )
}

