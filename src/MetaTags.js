import React from "react";
import { Helmet } from "react-helmet-async";

const BASE_URL = "https://alexanderbiba.github.io";
const DEFAULT_IMAGE = "/preview.png";

export default function MetaTags({ 
    title, 
    description, 
    image, 
    url,
    type = "website" 
}) {
    // Use default image if none provided
    const ogImage = image || DEFAULT_IMAGE;
    // Ensure image URL is absolute
    const ogImageUrl = ogImage.startsWith("http") 
        ? ogImage 
        : `${BASE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;
    
    // Ensure URL is absolute
    const ogUrl = url 
        ? (url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`)
        : BASE_URL;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            
            {/* Open Graph / Facebook */}
            {title && <meta property="og:type" content={type} />}
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:url" content={ogUrl} />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            <meta name="twitter:image" content={ogImageUrl} />
        </Helmet>
    );
}

