import Link from 'next/link'
import { Work } from '../types/blog'
import { formatPostDate } from '../lib/date'
import { extractDescription } from '../lib/description'
import '../Blog.scss'

interface WorksPreviewProps {
  works: Work[]
}

export default function WorksPreview({ works }: WorksPreviewProps) {
  if (works.length === 0) {
    return null
  }

  return (
    <div className="content-container">
      <h2>Things I’ve built</h2>
      <ul className="post-list">
        {works.map((work) => (
          <li key={work.slug} className="post-list-item">
            <Link href={`/works/${work.slug}`} className="post-title-link">
              <h3 className="post-title">{work.title}</h3>
            </Link>
            <time dateTime={work.date} className="post-date">
              {formatPostDate(work.date)}
            </time>
            <p className="post-excerpt">{extractDescription(work.content)}</p>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/works">See all →</Link>
      </p>
    </div>
  )
}
