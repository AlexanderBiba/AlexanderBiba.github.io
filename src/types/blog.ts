export interface BlogPost {
  slug: string
  title: string
  date: string
  ogImage: { _id: string; url: string } | string | null
  content: string
}


