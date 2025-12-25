import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost as BlogPostType } from '../posts/types'

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
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

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
            <img 
                src={imageSrc} 
                alt={alt || ''} 
                title={title || alt || ''}
                style={{ maxWidth: '100%', height: 'auto', margin: '1.5rem 0' }}
            />
        )
    }

    const tableRenderer = ({ children }: { children?: React.ReactNode }) => {
        return (
            <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    {children}
                </table>
            </div>
        )
    }

    return (
        <div className="content-container">
            <p>
                <Link href="/blog">← Back to posts</Link>
            </p>
            <article>
                <h1>{post.title}</h1>
                <time dateTime={post.date} style={{ color: '#666', fontSize: '0.9em', display: 'block', marginBottom: '2rem' }}>
                    {formatDate(post.date)}
                </time>
                <div className="markdown-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: imageRenderer,
                            table: tableRenderer,
                            a: ({ href, children }) => (
                                <a href={href} style={{ color: '#0066cc' }}>
                                    {children}
                                </a>
                            ),
                            code: ({ inline, children, className }) => {
                                if (inline) {
                                    return (
                                        <code style={{ 
                                            background: '#f5f5f5', 
                                            padding: '0.2em 0.4em',
                                            fontFamily: 'monospace',
                                            fontSize: '0.9em'
                                        }}>
                                            {children}
                                        </code>
                                    )
                                }
                                // For code blocks, return simple code element
                                // ReactMarkdown wraps it in <pre>
                                return (
                                    <code className={className} style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                        {children}
                                    </code>
                                )
                            },
                            pre: ({ children }) => {
                                return (
                                    <pre style={{ 
                                        background: '#f5f5f5', 
                                        padding: '1rem',
                                        overflow: 'auto',
                                        margin: '1.5rem 0'
                                    }}>
                                        {children}
                                    </pre>
                                )
                            },
                            blockquote: ({ children }) => (
                                <blockquote style={{ 
                                    borderLeft: '3px solid #ccc',
                                    paddingLeft: '1rem',
                                    margin: '1.5rem 0',
                                    color: '#666',
                                    fontStyle: 'italic'
                                }}>
                                    {children}
                                </blockquote>
                            ),
                            table: ({ children }) => (
                                <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                                    <table style={{ 
                                        width: '100%', 
                                        borderCollapse: 'collapse',
                                        border: '1px solid #ddd'
                                    }}>
                                        {children}
                                    </table>
                                </div>
                            ),
                            th: ({ children }) => (
                                <th style={{ 
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    textAlign: 'left',
                                    background: '#f5f5f5',
                                    fontWeight: '600'
                                }}>
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td style={{ 
                                    padding: '0.75rem',
                                    border: '1px solid #ddd'
                                }}>
                                    {children}
                                </td>
                            ),
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>
        </div>
    )
}

