export interface BlogPost {
  slug: string
  title: string
  date: string
  ogImage: { url: string } | string | null
  content: string
}

export interface Work {
  slug: string
  title: string
  date: string
  // The live site the entry links to.
  url?: string
  // Screenshot of the site, a local path under /content/.
  image?: string | null
  content: string
}

export interface SiteSettings {
  name: string
  aboutBlurb: string
  email?: string
  github?: string
  linkedin?: string
  twitter?: string
}

