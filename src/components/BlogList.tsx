import Link from 'next/link'
import { BlogPost } from '../types/blog'
import { formatPostDate } from '../lib/date'
import '../Blog.scss'

interface BlogListProps {
  posts: BlogPost[]
}

export default function BlogList({ posts }: BlogListProps) {
  return (
    <div className="content-container">
      <h1>Writing</h1>
      {posts.length === 0 ? (
        <p>No posts available yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-list-item">
              <Link href={`/blog/${post.slug}`} className="post-title-link">
                <h2 className="post-title">{post.title}</h2>
              </Link>
              <time dateTime={post.date} className="post-date">
                {formatPostDate(post.date)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

