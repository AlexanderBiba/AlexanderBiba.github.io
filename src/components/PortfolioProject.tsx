import { PortfolioProject as PortfolioProjectType } from '../types/blog'
import ContentPost from './ContentPost'

interface PortfolioProjectProps {
  project: PortfolioProjectType | null | undefined
}

export default function PortfolioProject({ project }: PortfolioProjectProps) {
  if (!project) {
    return (
      <div className="content-container">
        <h1>Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p>
          <a href="/projects">← Back to work</a>
        </p>
      </div>
    )
  }

  return (
    <ContentPost
      title={project.title}
      date={project.date}
      content={project.content}
      backLink={{ href: '/projects', label: 'Back to work' }}
      coverImage={project.image}
      coverImageFallback={project.previewImage}
      externalLink={project.url}
      imageFolder="portfolio-images"
    />
  )
}

