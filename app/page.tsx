import About from '../src/components/About'
import BlogPreview from '../src/components/BlogPreview'
import SocialMedia from '../src/components/SocialMedia'
import { getLatestPosts } from '../src/lib/sanity'

export default async function HomePage() {
  const posts = await getLatestPosts(3)

  return (
    <>
      <About />
      <BlogPreview posts={posts} />
      <SocialMedia />
    </>
  )
}

