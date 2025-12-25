import { Metadata } from 'next'
import 'easymde/dist/easymde.min.css'

export const metadata: Metadata = {
  title: 'Sanity Studio | Alex Biba',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: 'https://alexbiba.com/studio/',
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

