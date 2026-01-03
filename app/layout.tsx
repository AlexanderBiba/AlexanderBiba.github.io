import '../src/index.scss'
import { ReactNode } from 'react'
import { Metadata } from 'next'

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
        {children}
      </body>
    </html>
  )
}

