import Home from '../src/components/Home'
import About from '../src/components/About'
import BlogPreview from '../src/components/BlogPreview'
import Experience from '../src/components/Experience'
import Works from '../src/components/Works'
import SocialMedia from '../src/components/SocialMedia'
import { getLatestPosts } from '../src/lib/sanity'

export default async function HomePage() {
  const posts = await getLatestPosts(3)

  return (
    <>
      <Home />
      <About />
      <BlogPreview posts={posts} />
      <Experience />
      <Works />
      <SocialMedia />
    </>
  )
}

