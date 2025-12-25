import '../src/index.scss'
import ConditionalNavbar from '../src/components/ConditionalNavbar'
import PageTracking from '../src/components/PageTracking'
import Script from 'next/script'
import { ReactNode } from 'react'
import { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { generatePersonSchema } from '../src/lib/seo'

export const metadata: Metadata = {
  title: 'Alex Biba - Senior Software Engineer',
  description: 'Senior Software Engineer with over 10 years of experience building scalable solutions with modern technologies. Specializing in full-stack development with Node.js, React, and cloud technologies.',
  alternates: {
    canonical: 'https://alexanderbiba.github.io/',
  },
  openGraph: {
    title: 'Alex Biba - Senior Software Engineer',
    description: 'Senior Software Engineer with over 10 years of experience building scalable solutions with modern technologies.',
    url: 'https://alexanderbiba.github.io',
    siteName: 'Alex Biba',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alex Biba - Senior Software Engineer',
    description: 'Senior Software Engineer with over 10 years of experience building scalable solutions with modern technologies.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          data-domain="alexanderbiba.github.io"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Script
          id="person-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generatePersonSchema()) }}
        />
        <PageTracking />
        <div className="App">
          <ConditionalNavbar />
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}

