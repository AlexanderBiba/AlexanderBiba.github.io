import '../src/index.scss'
import Navbar from '../src/components/Navbar'
import Script from 'next/script'
import { ReactNode } from 'react'
import { Metadata } from 'next'
import { generatePersonSchema } from '../src/lib/seo'

export const metadata: Metadata = {
  title: 'Alex Biba',
  description: 'Software engineer.',
  alternates: {
    canonical: 'https://alexanderbiba.github.io/',
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

