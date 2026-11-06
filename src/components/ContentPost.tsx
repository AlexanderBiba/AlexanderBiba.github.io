import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatPostDate } from '../lib/date'
import { siteLabel } from '../lib/siteLabel'
import '../Blog.scss'

interface ImageProps {
  src?: string
  alt?: string
  title?: string
}

interface ContentPostProps {
  title: string
  date: string
  content: string
  backLink: { href: string; label: string }
  // Screenshot shown above the body; links to externalLink when there is one.
  coverImage?: string | null
  externalLink?: string
  imageFolder?: string
}

export default function ContentPost({
  title,
  date,
  content,
  backLink,
  coverImage,
  externalLink,
  imageFolder = 'images',
}: ContentPostProps) {
  const imageRenderer = ({ src, alt, title }: ImageProps) => {
    let imageSrc = src || ''
    if (src && !src.startsWith('http') && !src.startsWith('/')) {
      imageSrc = `/${imageFolder}/${src}`
    }
    // Wrap in a link so clicking opens the full-size image in a new tab.
    return (
      <a href={imageSrc} target="_blank" rel="noopener noreferrer">
        <img src={imageSrc} alt={alt || ''} title={title || alt || ''} />
      </a>
    )
  }

  return (
    <div className="content-container">
      <article>
        <h1>{title}</h1>
        <time dateTime={date} className="post-date post-date--block">
          {formatPostDate(date)}
        </time>
        {externalLink && (
          <p className="work-site-link">
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              {siteLabel(externalLink)}
            </a>
          </p>
        )}
        {coverImage && (
          <a
            href={externalLink || coverImage}
            target="_blank"
            rel="noopener noreferrer"
            className="work-screenshot"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={`Screenshot of ${title}`} width={1440} height={900} />
          </a>
        )}
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: imageRenderer }}>
            {content}
          </ReactMarkdown>
        </div>
      </article>
      <p>
        <Link href={backLink.href}>← {backLink.label}</Link>
      </p>
    </div>
  )
}

