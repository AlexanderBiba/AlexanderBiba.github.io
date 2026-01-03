import { PortfolioProject as PortfolioProjectType } from '../types/blog'
import ContentPost from './ContentPost'

interface PortfolioProjectProps {
  project: PortfolioProjectType | null | undefined
}

export default function PortfolioProject({ project }: PortfolioProjectProps) {
  if (!project) {
    return (
      <div className="content-container">
        <h1>Project Not Found</h1>
        <p>The project you're looking for doesn't exist.</p>
        <p>
          <a href="/portfolio">← Back to portfolio</a>
        </p>
      </div>
    )
  }

  return (
    <ContentPost
      title={project.title}
      date={project.date}
      content={project.content}
      backLink={{ href: '/portfolio', label: 'Back to portfolio' }}
      coverImage={project.image}
      externalLink={project.url}
      imageFolder="portfolio-images"
    />
  )
}

