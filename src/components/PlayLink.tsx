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
      <span aria-hidden="true">🎮</span>
    </Link>
  )
}
