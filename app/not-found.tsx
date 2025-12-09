import Link from 'next/link'

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

