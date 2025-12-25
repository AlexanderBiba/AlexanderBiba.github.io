'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAllPosts } from '../lib/sanity'
import { BlogPost } from '../posts/types'
import '../Blog.scss'

export default function BlogList() {
    const [posts, setPosts] = useState<Array<BlogPost & { excerpt: string }>>([])

    useEffect(() => {
        async function fetchPosts() {
            const fetchedPosts = await getAllPosts()
            setPosts(fetchedPosts.map(post => ({
                ...post,
                excerpt: post.content.substring(0, 150) + '...',
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
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <div className="blog-list">
            <div className="blog-container">
                <h1>Blog</h1>
                {posts.length === 0 ? (
                    <p>No posts available yet.</p>
                ) : (
                    <div className="posts-grid">
                        {posts.map((post) => (
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

