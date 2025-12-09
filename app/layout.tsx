import '../src/index.scss'
import Navbar from '../src/components/Navbar'
import PageTracking from '../src/components/PageTracking'
import Script from 'next/script'
import { ReactNode } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alex Biba - Senior Software Engineer',
  description: 'Senior Software Engineer with over 10 years of experience building scalable solutions with modern technologies. Specializing in full-stack development with Node.js, React, and cloud technologies.',
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
          src="https://www.googletagmanager.com/gtag/js?id=G-TSRMJ7J8LH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TSRMJ7J8LH');
          `}
        </Script>
        <Script
          data-domain="alexanderbiba.github.io"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <PageTracking />
        <div className="App">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}

