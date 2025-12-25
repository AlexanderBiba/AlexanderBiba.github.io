import Link from 'next/link'
import { BlogPost } from '../types/blog'
import { formatPostDate } from '../lib/date'
import '../Blog.scss'

interface BlogPreviewProps {
  posts: BlogPost[]
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
  if (posts.length === 0) {
    return null
  }

  return (
    <div className="content-container">
      <h2>Writing</h2>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug} className="post-list-item">
            <Link href={`/blog/${post.slug}`} className="post-title-link">
              <h3 className="post-title">{post.title}</h3>
            </Link>
            <time dateTime={post.date} className="post-date">
              {formatPostDate(post.date)}
            </time>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/blog">All posts →</Link>
      </p>
    </div>
  )
}

