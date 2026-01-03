import { Metadata } from 'next'
import 'easymde/dist/easymde.min.css'
import { getSiteSettings } from '../../src/lib/sanity'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
    title: settings ? `Sanity Studio | ${settings.name}` : 'Sanity Studio',
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    alternates: {
      canonical: 'https://alexbiba.com/studio/',
    },
  }
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

