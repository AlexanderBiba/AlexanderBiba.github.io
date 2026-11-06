import Link from 'next/link'
import { Work } from '../types/blog'
import { formatPostDate } from '../lib/date'
import { extractDescription } from '../lib/description'
import { siteLabel } from '../lib/siteLabel'
import '../Blog.scss'

interface WorkListProps {
  works: Work[]
}

export default function WorkList({ works }: WorkListProps) {
  return (
    <div className="content-container">
      <h1>Things I’ve built</h1>
      {works.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <ul className="post-list">
          {works.map((work) => (
            <li key={work.slug} className="post-list-item">
              <Link href={`/works/${work.slug}`} className="post-title-link">
                <h2 className="post-title">{work.title}</h2>
              </Link>
              <time dateTime={work.date} className="post-date">
                {formatPostDate(work.date)}
              </time>
              {work.url && (
                <p className="work-site-link">
                  <a href={work.url} target="_blank" rel="noopener noreferrer">
                    {siteLabel(work.url)}
                  </a>
                </p>
              )}
              {work.image && (
                <Link href={`/works/${work.slug}`} className="work-screenshot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={work.image} alt={`Screenshot of ${work.title}`} loading="lazy" />
                </Link>
              )}
              <p className="post-excerpt">{extractDescription(work.content)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
