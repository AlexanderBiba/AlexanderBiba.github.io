export interface BlogPost {
  slug: string
  title: string
  date: string
  ogImage: { _id: string; url: string } | string | null
  content: string
}

export interface PortfolioProject {
  slug: string
  title: string
  date: string
  image: { _id: string; url: string } | string | null
  url?: string
  content: string
  // Fallback illustration (e.g. the og:image of the linked site) used when no
  // image is provided in the Studio. Always an absolute URL or null.
  previewImage?: string | null
}

export interface SiteSettings {
  name: string
  aboutBlurb: string
  email?: string
  github?: string
  linkedin?: string
  twitter?: string
  avatar?: { _id: string; url: string } | null
}


