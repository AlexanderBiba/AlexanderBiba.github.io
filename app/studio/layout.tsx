import { Metadata } from 'next'
import 'easymde/dist/easymde.min.css'

export const metadata: Metadata = {
  title: 'Sanity Studio | Alex Biba',
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

