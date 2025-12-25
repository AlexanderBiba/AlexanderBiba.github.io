import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost as BlogPostType } from '../types/blog'
import { formatPostDate } from '../lib/date'
import '../Blog.scss'

interface BlogPostProps {
    post: BlogPostType | null | undefined
}

interface ImageProps {
    src?: string
    alt?: string
    title?: string
}

export default function BlogPost({ post }: BlogPostProps) {
    if (!post) {
        return (
            <div className="content-container">
                <h1>Post Not Found</h1>
                <p>The blog post you're looking for doesn't exist.</p>
                <p>
                    <Link href="/blog">← Back to posts</Link>
                </p>
            </div>
        )
    }

    const imageRenderer = ({ src, alt, title }: ImageProps) => {
        let imageSrc = src || ''
        
        if (src && !src.startsWith('http') && !src.startsWith('/')) {
            imageSrc = `/blog-images/${src}`
        }
        
        return (
            <img src={imageSrc} alt={alt || ''} title={title || alt || ''} />
        )
    }

    return (
        <div className="content-container">
            <p>
                <Link href="/blog">← Back to posts</Link>
            </p>
            <article>
                <h1>{post.title}</h1>
                <time dateTime={post.date} className="post-date post-date--block">
                    {formatPostDate(post.date)}
                </time>
                <div className="markdown-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: imageRenderer,
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>
        </div>
    )
}

