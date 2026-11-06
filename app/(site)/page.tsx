import About from '../../src/components/About'
import BlogPreview from '../../src/components/BlogPreview'
import WorksPreview from '../../src/components/WorksPreview'
import SocialMedia from '../../src/components/SocialMedia'
import { getLatestPosts, getLatestWorks, getSiteSettings } from '../../src/lib/content'

export default async function HomePage() {
  const [posts, works, siteSettings] = await Promise.all([
    getLatestPosts(3),
    getLatestWorks(3),
    getSiteSettings(),
  ])

  return (
    <>
      <About settings={siteSettings} />
      <BlogPreview posts={posts} />
      <WorksPreview works={works} />
      <SocialMedia settings={siteSettings} />
    </>
  )
}



