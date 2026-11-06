'use client'

import { useEffect } from 'react'
import { isProductionHost, visitorOptedOut } from '../lib/privacy'

// Cloudflare Web Analytics site token (Cloudflare dashboard → Analytics & Logs →
// Web Analytics → alexbiba.com → Manage site). It is public by design, so
// committing it is fine. Analytics stays off while this is empty.
const CLOUDFLARE_ANALYTICS_TOKEN = 'b8babb10a7e24d049cc31cb6f481158c'

// Cookieless page views: the beacon stores nothing on the visitor's device and
// doesn't fingerprint, so no cookie banner is needed. It follows client-side
// navigations on its own (`spa` is on by default).
export default function CloudflareAnalytics() {
  useEffect(() => {
    if (!CLOUDFLARE_ANALYTICS_TOKEN || !isProductionHost() || visitorOptedOut()) return
    if (document.querySelector('script[data-cf-beacon]')) return

    const script = document.createElement('script')
    // Matches the dashboard snippet, which loads the beacon as a module.
    script.type = 'module'
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    script.dataset.cfBeacon = JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN })
    document.body.appendChild(script)
  }, [])

  return null
}
