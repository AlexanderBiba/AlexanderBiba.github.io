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
      {/* Two cards with a small star in the Built pack's color. The ring around them is in Navbar.scss. */}
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g transform="translate(-1.2 1.6) scale(.92)" fill="#fff" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="4.5" y="5" width="9.5" height="13.5" rx="1.8" transform="rotate(-12 9.25 11.75)" />
            <rect x="10" y="5.5" width="9.5" height="13.5" rx="1.8" transform="rotate(10 14.75 12.25)" />
          </g>
          <path d="M19.6 1.5l.87 2.23 2.23.87-2.23.87-.87 2.23-.87-2.23-2.23-.87 2.23-.87z" fill="#22c7c0" />
        </svg>
      </span>
    </Link>
  )
}
