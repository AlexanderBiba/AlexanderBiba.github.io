import React from "react";
import { Link } from "react-router-dom";
import { getAllPosts } from "./posts/posts";
import "./Blog.scss";

export default function BlogList() {
    const posts = getAllPosts().map(post => ({
        ...post,
        excerpt: post.content.substring(0, 150) + "...",
    }));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

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
    );
}

