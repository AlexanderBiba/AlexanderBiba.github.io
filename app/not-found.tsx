import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Alex Biba',
  description: 'The page you are looking for does not exist.',
  alternates: {
    canonical: 'https://alexanderbiba.github.io/404',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="blog-post">
      <div className="blog-container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link href="/">← Back to Home</Link>
      </div>
    </div>
  )
}

