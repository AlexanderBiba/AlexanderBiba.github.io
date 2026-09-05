import type { Metadata } from 'next'
import { getSiteSettings } from './content'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  
  if (!settings) {
    return {
      title: 'Projects',
      description: 'Personal projects and writing',
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

