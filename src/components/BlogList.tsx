import Link from 'next/link'
import { BlogPost } from '../posts/types'
import '../Blog.scss'

interface BlogListProps {
    posts: BlogPost[]
}

export default function BlogList({ posts }: BlogListProps) {
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

    const postsWithExcerpt = posts.map(post => ({
        ...post,
        excerpt: post.content.substring(0, 150) + '...',
    }))

    return (
        <div className="blog-list">
            <div className="blog-container">
                <h1>Blog</h1>
                {postsWithExcerpt.length === 0 ? (
                    <p>No posts available yet.</p>
                ) : (
                    <div className="posts-grid">
                        {postsWithExcerpt.map((post) => (
                            <article key={post.slug} className="post-card">
                                <Link href={`/blog/${post.slug}`}>
                                    <h2>{post.title}</h2>
                                    <time>{formatDate(post.date)}</time>
                                    <p>{post.excerpt}</p>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

