'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cover, morphIntoPack } from '../cards/morph'

// Load the pack's cover art before the morph needs it.
const warm = () => { if (cover) new Image().src = cover }

export default function PlayLink() {
  const router = useRouter()
  return (
    <Link
      href="/play/"
      className="explore-link"
      aria-label="Open my card packs"
      title="Open my card packs"
      onPointerEnter={warm}
      onTouchStart={warm}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
