import About from '../../src/components/About'
import BlogPreview from '../../src/components/BlogPreview'
import ProjectsPreview from '../../src/components/ProjectsPreview'
import SocialMedia from '../../src/components/SocialMedia'
import { getLatestPosts, getLatestProjects, getSiteSettings } from '../../src/lib/sanity'

export default async function HomePage() {
  const [posts, projects, siteSettings] = await Promise.all([
    getLatestPosts(3),
    getLatestProjects(3),
    getSiteSettings(),
  ])

  return (
    <>
      <About settings={siteSettings} />
      <BlogPreview posts={posts} />
      <ProjectsPreview projects={projects} />
      <SocialMedia settings={siteSettings} />
    </>
  )
}



