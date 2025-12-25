import Link from 'next/link'
import { BlogPost } from '../posts/types'

interface BlogPreviewProps {
    posts: BlogPost[]
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
    const formatDate = (dateString: string): string => {
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    if (posts.length === 0) {
        return null
    }

    return (
        <div className="content-container">
            <h2>Writing</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {posts.map((post) => (
                    <li key={post.slug} style={{ marginBottom: '2rem' }}>
                        <Link href={`/blog/${post.slug}`} style={{ color: '#1a1a1a' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h3>
                        </Link>
                        <time dateTime={post.date} style={{ color: '#666', fontSize: '0.9em' }}>
                            {formatDate(post.date)}
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

