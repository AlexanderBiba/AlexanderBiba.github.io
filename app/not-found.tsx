import Link from 'next/link'
import { Metadata } from 'next'
import { getSiteSettings } from '../src/lib/sanity'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: settings ? `404 - Page Not Found | ${settings.name}` : '404 - Page Not Found',
    description: 'The page you are looking for does not exist.',
    alternates: {
      canonical: 'https://alexbiba.com/404/',
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default function NotFound() {
  return (
    <div className="content-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <p>
        <Link href="/">← Back to Home</Link>
      </p>
    </div>
  )
}

