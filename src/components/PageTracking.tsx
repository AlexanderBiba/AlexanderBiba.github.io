'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// GA4 Measurement ID - centralized for easy updates
const GA4_MEASUREMENT_ID = 'G-TSRMJ7J8LH'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    plausible?: (event: string) => void
  }
}

export default function PageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Wait a tick to ensure document.title is updated
    const timeoutId = setTimeout(() => {
      const pagePath = pathname || window.location.pathname
      const pageTitle = document.title

      // Track page view in GA4
      if (typeof window !== 'undefined' && window.gtag) {
        // Update config with new page path and title
        window.gtag('config', GA4_MEASUREMENT_ID, {
          page_path: pagePath,
          page_title: pageTitle,
        })

        // Explicitly send page_view event for better tracking
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle,
          page_location: window.location.href,
        })
      }

      // Track page view in Plausible (if available)
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('pageview')
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [pathname])

  return null
}

