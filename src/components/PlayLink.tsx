'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect } from 'react'
import { morphIntoPack, morphOutOfPack, primeMorph, returnPack } from '../cards/morph'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function PlayLink() {
  const router = useRouter()

  // Coming back from /play/, which leaves its pack on screen: grow the page out of it before
  // the page is first drawn.
  useLayoutEffect(() => {
    const app = document.querySelector<HTMLElement>('.App')
    if (returnPack() && app) morphOutOfPack(app)
  }, [])

  // Paint the pack the page turns into while nothing else is going on, so a tap starts at once.
  useEffect(() => {
    if (reducedMotion()) return
    const prime = () => primeMorph()
    // Safari has no requestIdleCallback.
    const idle = typeof requestIdleCallback === 'function'
    const id = idle ? requestIdleCallback(prime, { timeout: 3000 }) : window.setTimeout(prime, 1500)
    return () => { if (idle) cancelIdleCallback(id); else clearTimeout(id) }
  }, [])

  return (
    <Link
      href="/play/"
      className="explore-link"
      aria-label="Open my card packs"
      title="Open my card packs"
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        if (reducedMotion()) return
        const app = document.querySelector<HTMLElement>('.App')
        if (!app || typeof app.animate !== 'function') return
        event.preventDefault()
        morphIntoPack(app, () => router.push('/play/'))
      }}
    >
      {/* A fan of three cards, one in each pack's color. */}
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <g stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round">
            <rect x="7.5" y="5" width="9" height="13" rx="1.7" fill="#ff8a4c" transform="rotate(-28 12 20)" />
            <rect x="7.5" y="5" width="9" height="13" rx="1.7" fill="#8b5cf6" transform="rotate(28 12 20)" />
            <rect x="7.5" y="3.5" width="9" height="13" rx="1.7" fill="#22c7c0" />
          </g>
          <path d="M12 6.6l.95 2.45 2.45.95-2.45.95L12 13.4l-.95-2.45L8.6 10l2.45-.95z" fill="#fff" />
        </svg>
      </span>
    </Link>
  )
}
