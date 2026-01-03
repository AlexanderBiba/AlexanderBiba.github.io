export interface BlogPost {
  slug: string
  title: string
  date: string
  ogImage: { _id: string; url: string } | string | null
  content: string
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


