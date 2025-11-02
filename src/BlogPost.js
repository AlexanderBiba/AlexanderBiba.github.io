import React from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug } from "./posts/posts";
import "./Blog.scss";

export default function BlogPost() {
    const { slug } = useParams();
    const post = slug ? getPostBySlug(slug) : null;

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

    if (!post) {
        return (
            <div className="blog-post">
                <div className="blog-container">
                    <h1>Post Not Found</h1>
                    <p>The blog post you're looking for doesn't exist.</p>
                    <Link to="/blog">← Back to Blog</Link>
                </div>
            </div>
        );
    }

    // Custom renderer for images to handle paths correctly
    const imageRenderer = ({ src, alt, title }) => {
        // Normalize the src path
        let imageSrc = src;
        
        // If the image path is relative (doesn't start with http or /), resolve it from blog-images
        if (src && !src.startsWith("http") && !src.startsWith("/")) {
            // Images from src/assets/blog-images/ are copied to public/blog-images/ during build
            // In markdown, reference images by filename only, e.g., ![Alt](image.jpg)
            imageSrc = `/blog-images/${src}`;
        }
        
        return (
            <img 
                src={imageSrc} 
                alt={alt || ""} 
                title={title || alt || ""}
                onError={(e) => {
                    console.error(`Failed to load image: ${imageSrc}`);
                    e.target.style.display = 'none';
                }}
            />
        );
    };

    return (
        <div className="blog-post">
            <div className="blog-container">
                <Link to="/blog" className="back-link">← Back to posts</Link>
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
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </div>
        </div>
    );
}

