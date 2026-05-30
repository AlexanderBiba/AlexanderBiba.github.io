import Link from 'next/link'
import { PortfolioProject } from '../types/blog'
import { formatPostDate } from '../lib/date'
import { extractDescription } from '../lib/description'
import '../Blog.scss'

interface ProjectsPreviewProps {
  projects: PortfolioProject[]
}

export default function ProjectsPreview({ projects }: ProjectsPreviewProps) {
  if (projects.length === 0) {
    return null
  }

  return (
    <div className="content-container">
      <h2>Projects</h2>
      <ul className="post-list">
        {projects.map((project) => (
          <li key={project.slug} className="post-list-item">
            <Link href={`/projects/${project.slug}`} className="post-title-link">
              <h3 className="post-title">{project.title}</h3>
            </Link>
            <time dateTime={project.date} className="post-date">
              {formatPostDate(project.date)}
            </time>
            <p className="post-excerpt">{extractDescription(project.content)}</p>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/projects">All projects →</Link>
      </p>
    </div>
  )
}
