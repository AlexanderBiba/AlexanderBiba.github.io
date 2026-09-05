import '../src/index.scss'
import { ReactNode } from 'react'
import { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Alex Biba',
  description: 'Personal projects and writing by Alex Biba',
  metadataBase: new URL('https://alexbiba.com'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

