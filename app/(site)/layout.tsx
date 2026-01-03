import Navbar from '../../src/components/Navbar'
import Script from 'next/script'
import { ReactNode } from 'react'
import { generatePersonSchema } from '../../src/lib/seo'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="App">
      <Script
        id="person-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generatePersonSchema()) }}
      />
      <Navbar />
      {children}
    </div>
  )
}



