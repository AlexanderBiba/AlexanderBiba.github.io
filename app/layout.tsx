import '../src/index.scss'
import { ReactNode } from 'react'
import CloudflareAnalytics from '../src/components/CloudflareAnalytics'
import PostHogAnalytics from '../src/components/PostHogAnalytics'

export { generateMetadata } from '../src/lib/siteMetadata'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CloudflareAnalytics />
        <PostHogAnalytics />
      </body>
    </html>
  )
}

