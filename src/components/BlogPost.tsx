import { BlogPost as BlogPostType } from '../types/blog'
import ContentPost from './ContentPost'

interface BlogPostProps {
  post: BlogPostType | null | undefined
}

export default function BlogPost({ post }: BlogPostProps) {
  if (!post) {
    return (
      <div className="content-container">
        <h1>Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist.</p>
        <p>
          <a href="/blog">← Back to posts</a>
        </p>
      </div>
    )
  }

  return (
    <ContentPost
      title={post.title}
      date={post.date}
      content={post.content}
      backLink={{ href: '/blog', label: 'Back to posts' }}
      imageFolder="blog-images"
    />
  )
}

