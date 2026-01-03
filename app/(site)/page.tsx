import About from '../../src/components/About'
import BlogPreview from '../../src/components/BlogPreview'
import SocialMedia from '../../src/components/SocialMedia'
import { getLatestPosts, getSiteSettings } from '../../src/lib/sanity'

export default async function HomePage() {
  const [posts, siteSettings] = await Promise.all([
    getLatestPosts(3),
    getSiteSettings(),
  ])

  return (
    <>
      <About settings={siteSettings} />
      <BlogPreview posts={posts} />
      <SocialMedia settings={siteSettings} />
    </>
  )
}



