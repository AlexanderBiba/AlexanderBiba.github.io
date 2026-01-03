import Navbar from '../../src/components/Navbar'
import Script from 'next/script'
import { ReactNode } from 'react'
import { generatePersonSchema } from '../../src/lib/seo'
import { getSiteSettings } from '../../src/lib/sanity'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  const schema = generatePersonSchema(settings)

  return (
    <div className="App">
      {schema && (
        <Script
          id="person-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <Navbar />
      {children}
    </div>
  )
}



