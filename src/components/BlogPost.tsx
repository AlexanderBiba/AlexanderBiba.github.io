import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost as BlogPostType } from '../posts/types'
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
    const formatDate = (dateString: string): string => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    if (!post) {
        return (
            <div className="blog-post">
                <div className="blog-container">
                    <h1>Post Not Found</h1>
                    <p>The blog post you're looking for doesn't exist.</p>
                    <Link href="/blog">← Back to Blog</Link>
                </div>
            </div>
        )
    }

    // Custom renderer for images to handle paths correctly
    const imageRenderer = ({ src, alt, title }: ImageProps) => {
        // Normalize the src path
        let imageSrc = src || ''
        
        // If the image path is relative (doesn't start with http or /), resolve it from blog-images
        if (src && !src.startsWith('http') && !src.startsWith('/')) {
            // Images from src/assets/blog-images/ are copied to public/blog-images/ during build
            // In markdown, reference images by filename only, e.g., ![Alt](image.jpg)
            imageSrc = `/blog-images/${src}`
        }
        
        return (
            <img 
                src={imageSrc} 
                alt={alt || ''} 
                title={title || alt || ''}
            />
        )
    }

    // Custom renderer for tables to wrap them in a scrollable container
    const tableRenderer = ({ children }: { children?: React.ReactNode }) => {
        return (
            <div className="table-wrapper">
                <table>{children}</table>
            </div>
        )
    }

    return (
        <div className="blog-post">
            <div className="blog-container">
                <Link href="/blog" className="back-link">← Back to posts</Link>
                <article>
                    <header>
                        <h1>{post.title}</h1>
                        <time>{formatDate(post.date)}</time>
                    </header>
                    <div className="markdown-content">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                img: imageRenderer,
                                table: tableRenderer,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </div>
        </div>
    )
}

