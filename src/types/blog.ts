export interface BlogPost {
  slug: string
  title: string
  date: string
  description: string
  ogImage: { _id: string; url: string } | string | null
  content: string
}


