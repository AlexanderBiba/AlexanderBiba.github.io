export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Alex Biba',
    jobTitle: 'Senior Software Engineer',
    description: 'Senior Software Engineer with over 10 years of experience building scalable solutions with modern technologies.',
    url: 'https://alexbiba.com',
    sameAs: [
      'https://github.com/AlexanderBiba',
      'https://www.linkedin.com/in/alexander-biba-b9794771',
      'https://www.facebook.com/alexbiba',
      'https://www.instagram.com/alexbiba',
    ],
  }
}

export function generateBlogPostingSchema(post: {
  title: string
  description?: string
  date: string
  slug: string
  ogImage?: string | { url: string } | null
}) {
  const baseUrl = 'https://alexbiba.com'
  const postUrl = `${baseUrl}/blog/${post.slug}/`
  
  // Format date for schema.org (ISO 8601)
  const publishedDate = new Date(post.date).toISOString()
  
  // Get image URL
  let imageUrl = `${baseUrl}/avatar.png`
  if (post.ogImage) {
    if (typeof post.ogImage === 'string') {
      imageUrl = post.ogImage.startsWith('http') 
        ? post.ogImage 
        : `${baseUrl}${post.ogImage.startsWith('/') ? post.ogImage : `/${post.ogImage}`}`
    } else if (post.ogImage && typeof post.ogImage === 'object' && 'url' in post.ogImage) {
      imageUrl = post.ogImage.url.startsWith('http')
        ? post.ogImage.url
        : `${baseUrl}${post.ogImage.url.startsWith('/') ? post.ogImage.url : `/${post.ogImage.url}`}`
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || post.title,
    image: imageUrl,
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      '@type': 'Person',
      name: 'Alex Biba',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Person',
      name: 'Alex Biba',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
  }
}

export function generateCollectionPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog | Alex Biba',
    description: 'Software development, coding experiments, 3D printing, and other projects I enjoy exploring.',
    url: 'https://alexbiba.com/blog/',
  }
}

