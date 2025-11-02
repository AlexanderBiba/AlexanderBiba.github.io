import React from "react";
import { Link } from "react-router-dom";
import { getLatestPosts } from "./posts/posts";
import "./BlogPreview.scss";

export default function BlogPreview() {
    const posts = getLatestPosts(3).map(post => ({
        ...post,
        excerpt: post.content.substring(0, 100) + "...",
    }));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (posts.length === 0) {
        return null; // Don't render if no posts
    }

    return (
        <section id="blog-preview">
            <h2>Latest Blog Posts</h2>
            <div className="blog-posts-grid">
                {posts.map((post) => (
                    <article key={post.slug} className="blog-post-card">
                        <Link to={`/blog/${post.slug}`}>
                            <h3>{post.title}</h3>
                            <time>{formatDate(post.date)}</time>
                            <p>{post.excerpt}</p>
                            <span className="read-more">Read more →</span>
                        </Link>
                    </article>
                ))}
            </div>
            <div className="blog-cta">
                <Link to="/blog" className="btn-primary">
                    View All Posts
                </Link>
            </div>
        </section>
    );
}

