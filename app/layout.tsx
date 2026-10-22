import '../src/index.scss'
import { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/next'
import PostHogAnalytics from '../src/components/PostHogAnalytics'

export { generateMetadata } from '../src/lib/siteMetadata'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <PostHogAnalytics />
      </body>
    </html>
  )
}

