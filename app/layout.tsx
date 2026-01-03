import '../src/index.scss'
import { ReactNode } from 'react'
import { Metadata } from 'next'
import { getSiteSettings } from '../src/lib/sanity'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  
  if (!settings) {
    return {
      title: 'Portfolio',
      description: 'Personal portfolio and blog',
      metadataBase: new URL('https://alexbiba.com'),
    }
  }
  
  return {
    title: settings.name,
    description: settings.aboutBlurb,
    metadataBase: new URL('https://alexbiba.com'),
    alternates: {
      canonical: 'https://alexbiba.com/',
    },
    openGraph: {
      title: settings.name,
      description: settings.aboutBlurb,
      url: 'https://alexbiba.com/',
      siteName: settings.name,
      type: 'website',
      images: ['/avatar.png'],
    },
    twitter: {
      card: 'summary',
      title: settings.name,
      description: settings.aboutBlurb,
      images: ['/avatar.png'],
    },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

