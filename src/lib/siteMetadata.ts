import type { Metadata } from 'next'
import { getSiteSettings } from './content'

export async function getSiteMetadata({ pathname = '/' }: { pathname?: string } = {}): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings.name
  const description = settings.aboutBlurb
  const url = new URL(pathname, 'https://alexbiba.com').href

  return {
    title,
    description,
    metadataBase: new URL('https://alexbiba.com'),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: title,
      type: 'website',
      images: ['/avatar.png'],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/avatar.png'],
    },
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return getSiteMetadata()
}
