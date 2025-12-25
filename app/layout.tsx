import '../src/index.scss'
import Navbar from '../src/components/Navbar'
import Script from 'next/script'
import { ReactNode } from 'react'
import { Metadata } from 'next'
import { generatePersonSchema } from '../src/lib/seo'

export const metadata: Metadata = {
  title: 'Alex Biba',
  description: 'Software engineer.',
  metadataBase: new URL('https://alexbiba.com'),
  alternates: {
    canonical: 'https://alexbiba.com/',
  },
  openGraph: {
    title: 'Alex Biba',
    description: 'Software engineer.',
    url: 'https://alexbiba.com/',
    siteName: 'Alex Biba',
    type: 'website',
    images: ['/avatar.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Alex Biba',
    description: 'Software engineer.',
    images: ['/avatar.png'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          id="person-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generatePersonSchema()) }}
        />
        <div className="App">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}

