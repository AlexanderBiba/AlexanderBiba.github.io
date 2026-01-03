import Link from 'next/link'
import Image from 'next/image'
import { PortfolioProject } from '../types/blog'
import { formatPostDate } from '../lib/date'
import { extractDescription } from '../lib/description'
import '../Blog.scss'

interface PortfolioListProps {
  projects: PortfolioProject[]
}

export default function PortfolioList({ projects }: PortfolioListProps) {
  return (
    <div className="content-container">
      <h1>Portfolio</h1>
      {projects.length === 0 ? (
        <p>No projects available yet.</p>
      ) : (
        <ul className="post-list">
          {projects.map((project) => (
            <li key={project.slug} className="post-list-item">
              <Link href={`/portfolio/${project.slug}`} className="post-title-link">
                <h2 className="post-title">{project.title}</h2>
              </Link>
              <time dateTime={project.date} className="post-date">
                {formatPostDate(project.date)}
              </time>
              {project.image && typeof project.image !== 'string' && (
                <div className="project-image">
                  <Image
                    src={project.image.url}
                    alt={project.title}
                    width={800}
                    height={450}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              )}
              <p className="post-excerpt">{extractDescription(project.content)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

