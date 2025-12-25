'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getLatestPosts } from '../lib/sanity'
import { BlogPost } from '../posts/types'
import '../BlogPreview.scss'

export default function BlogPreview() {
    const [posts, setPosts] = useState<Array<BlogPost & { excerpt: string }>>([])

    useEffect(() => {
        async function fetchPosts() {
            const fetchedPosts = await getLatestPosts(3)
            setPosts(fetchedPosts.map(post => ({
                ...post,
                excerpt: post.content.substring(0, 100) + '...',
            })))
        }
        fetchPosts()
    }, [])

    const formatDate = (dateString: string): string => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    if (posts.length === 0) {
        return null // Don't render if no posts
    }

    return (
        <section id="blog-preview">
            <h2>Latest Blog Posts</h2>
            <div className="blog-posts-grid">
                {posts.map((post) => (
                    <article key={post.slug} className="blog-post-card">
                        <Link href={`/blog/${post.slug}`}>
                            <h3>{post.title}</h3>
                            <time>{formatDate(post.date)}</time>
                            <p>{post.excerpt}</p>
                            <span className="read-more">Read more →</span>
                        </Link>
                    </article>
                ))}
            </div>
            <div className="blog-cta">
                <Link href="/blog" className="btn-primary">
                    View All Posts
                </Link>
            </div>
        </section>
    )
}

