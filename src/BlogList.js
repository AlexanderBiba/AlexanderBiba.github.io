import React from "react";
import { Link } from "react-router-dom";
import { getAllPosts } from "./posts/posts";
import MetaTags from "./MetaTags";
import "./Blog.scss";

export default function BlogList() {
    const posts = getAllPosts().map(post => ({
        ...post,
        excerpt: post.content.substring(0, 150) + "...",
    }));

    const formatDate = (dateString) => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <>
            <MetaTags
                title="Blog | Alex Biba"
                description="Software development, coding experiments, 3D printing, and other projects I enjoy exploring."
                url="/blog"
            />
            <div className="blog-list">
                <div className="blog-container">
                    <h1>Blog</h1>
                    {posts.length === 0 ? (
                        <p>No posts available yet.</p>
                    ) : (
                        <div className="posts-grid">
                            {posts.map((post) => (
                                <article key={post.slug} className="post-card">
                                    <Link to={`/blog/${post.slug}`}>
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
        </>
    );
}

