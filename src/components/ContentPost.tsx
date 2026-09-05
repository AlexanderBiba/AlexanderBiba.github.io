import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatPostDate } from '../lib/date'
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
  coverImage?: { url: string } | string | null
  coverImageFallback?: string | null
  externalLink?: string
  imageFolder?: string
}

export default function ContentPost({
  title,
  date,
  content,
  backLink,
  coverImage,
  coverImageFallback,
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

  const primaryCover = coverImage && typeof coverImage !== 'string' ? coverImage : null
  const fallbackCover = !primaryCover ? coverImageFallback : null

  return (
    <div className="content-container">
      <article>
        <h1>{title}</h1>
        <time dateTime={date} className="post-date post-date--block">
          {formatPostDate(date)}
        </time>
        {primaryCover && (
          <div className="project-cover-image">
            <a href={primaryCover.url} target="_blank" rel="noopener noreferrer">
              <Image
                src={primaryCover.url}
                alt={title}
                width={1200}
                height={675}
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            </a>
          </div>
        )}
        {fallbackCover && (
          <div className="project-cover-image">
            <a href={fallbackCover} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fallbackCover} alt={title} />
            </a>
          </div>
        )}
        {externalLink && (
          <p className="project-link-block">
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              View Project →
            </a>
          </p>
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

