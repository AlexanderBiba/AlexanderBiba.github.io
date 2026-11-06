import { Work } from '../types/blog'
import ContentPost from './ContentPost'

interface WorkPageProps {
  work: Work | null | undefined
}

export default function WorkPage({ work }: WorkPageProps) {
  if (!work) {
    return (
      <div className="content-container">
        <h1>Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p>
          <a href="/works">← Back to things I’ve built</a>
        </p>
      </div>
    )
  }

  return (
    <ContentPost
      title={work.title}
      date={work.date}
      content={work.content}
      backLink={{ href: '/works', label: 'Back to things I’ve built' }}
      coverImage={work.image}
      externalLink={work.url}
      imageFolder="portfolio-images"
    />
  )
}
