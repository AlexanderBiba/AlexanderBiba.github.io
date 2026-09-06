export interface BlogPost {
  slug: string
  title: string
  date: string
  ogImage: { url: string } | string | null
  content: string
}

export interface PortfolioProject {
  slug: string
  title: string
  date: string
  image: { url: string } | string | null
  url?: string
  content: string
  // Fallback illustration (e.g. the og:image of the linked site) used when no
  // cover image is provided. A local path or null.
  previewImage?: string | null
}

export interface SiteSettings {
  name: string
  aboutBlurb: string
  email?: string
  github?: string
  linkedin?: string
  twitter?: string
}


