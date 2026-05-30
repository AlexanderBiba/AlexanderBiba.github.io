import PortfolioList from '../../../src/components/PortfolioList'
import { Metadata } from 'next'
import { getAllProjects, getSiteSettings } from '../../../src/lib/sanity'
import Script from 'next/script'
import { generateCollectionPageSchema } from '../../../src/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings ? `Projects | ${settings.name}` : 'Projects'
  const description = 'A showcase of projects I\'ve built and worked on.'

  return {
    title,
    description,
    alternates: {
      canonical: 'https://alexbiba.com/projects/',
    },
    openGraph: {
      title,
      description,
      url: 'https://alexbiba.com/projects/',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([getAllProjects(), getSiteSettings()])
  const schema = generateCollectionPageSchema(settings, 'projects')

  return (
    <>
      {schema && (
        <Script
          id="projects-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <PortfolioList projects={projects} />
    </>
  )
}
