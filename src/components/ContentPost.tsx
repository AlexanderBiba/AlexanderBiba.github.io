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
    return <img src={imageSrc} alt={alt || ''} title={title || alt || ''} />
  }

  return (
    <div className="content-container">
      <p>
        <Link href={backLink.href}>← {backLink.label}</Link>
      </p>
      <article>
        <h1>{title}</h1>
        <time dateTime={date} className="post-date post-date--block">
          {formatPostDate(date)}
        </time>
        {externalLink && (
          <p className="project-link-block">
            <a href={externalLink} target="_blank" rel="noopener noreferrer">
              View Project →
            </a>
          </p>
        )}
        {coverImage && typeof coverImage !== 'string' && (
          <div className="project-cover-image">
            <Image
              src={coverImage.url}
              alt={title}
              width={1200}
              height={675}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </div>
        )}
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: imageRenderer }}>
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}

