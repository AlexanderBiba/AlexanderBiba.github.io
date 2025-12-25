import Link from 'next/link'
import { BlogPost } from '../posts/types'

interface BlogListProps {
    posts: BlogPost[]
}

export default function BlogList({ posts }: BlogListProps) {
    const formatDate = (dateString: string): string => {
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <div className="content-container">
            <h1>Writing</h1>
            {posts.length === 0 ? (
                <p>No posts available yet.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {posts.map((post) => (
                        <li key={post.slug} style={{ marginBottom: '2rem' }}>
                            <Link href={`/blog/${post.slug}`} style={{ color: '#1a1a1a' }}>
                                <h2 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h2>
                            </Link>
                            <time dateTime={post.date} style={{ color: '#666', fontSize: '0.9em' }}>
                                {formatDate(post.date)}
                            </time>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

