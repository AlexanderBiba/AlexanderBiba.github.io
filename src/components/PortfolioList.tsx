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
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects available yet.</p>
      ) : (
        <ul className="post-list">
          {projects.map((project) => {
            const projectImage =
              project.image && typeof project.image !== 'string' ? project.image : null
            const fallbackImage = !projectImage ? project.previewImage : null

            return (
              <li key={project.slug} className="post-list-item">
                <Link href={`/projects/${project.slug}`} className="post-title-link">
                  <h2 className="post-title">{project.title}</h2>
                </Link>
                <time dateTime={project.date} className="post-date">
                  {formatPostDate(project.date)}
                </time>
                {projectImage && (
                  <div className="project-image">
                    <a href={projectImage.url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={projectImage.url}
                        alt={project.title}
                        width={800}
                        height={450}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </a>
                  </div>
                )}
                {fallbackImage && (
                  <div className="project-image">
                    <a href={fallbackImage} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fallbackImage} alt={project.title} loading="lazy" />
                    </a>
                  </div>
                )}
                <p className="post-excerpt">{extractDescription(project.content)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
