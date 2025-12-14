'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    plausible?: (event: string) => void
  }
}

export default function PageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Wait a tick to ensure document.title is updated
    const timeoutId = setTimeout(() => {
      // Track page view in Plausible (if available)
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('pageview')
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [pathname])

  return null
}

