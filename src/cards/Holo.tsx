'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { tilt } from './motion'
import styles from './cards.module.css'

// Tilts its children toward the pointer or the phone's angle and moves the foil and glare with it.
// With nothing to follow it sways slowly on its own. Reduced motion keeps it flat.
export default function Holo({ children, className = '', depth = 1, seed = 0, style }: { children: ReactNode; className?: string; depth?: number; seed?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let pointer: { x: number; y: number; t: number } | null = null, frame = 0
    const current = { x: 0, y: 0 }, start = performance.now()
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      pointer = { x: ((event.clientX - rect.left) / rect.width) * 2 - 1, y: ((event.clientY - rect.top) / rect.height) * 2 - 1, t: performance.now() }
    }
    const leave = () => { pointer = null }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); el.addEventListener('pointercancel', leave)
    const loop = (now: number) => {
      let target = { x: 0, y: 0 }
      if (pointer && now - pointer.t < 2500) target = pointer
      else if (tilt.active) target = tilt
      else if (!reduced) { const t = (now - start) / 1000 + seed; target = { x: Math.sin(t * 0.8) * 0.55, y: Math.cos(t * 0.55) * 0.35 } }
      current.x += (Math.max(-1, Math.min(1, target.x)) - current.x) * 0.1
      current.y += (Math.max(-1, Math.min(1, target.y)) - current.y) * 0.1
      const turn = reduced ? 0 : depth
      el.style.setProperty('--rx', `${(-current.y * 12 * turn).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(current.x * 16 * turn).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(50 + current.x * 50).toFixed(1)}%`)
      el.style.setProperty('--my', `${(50 + current.y * 50).toFixed(1)}%`)
      el.style.setProperty('--glare', (0.25 + Math.min(1, Math.hypot(current.x, current.y)) * 0.55).toFixed(2))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frame); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.removeEventListener('pointercancel', leave) }
  }, [depth, seed])
  return <div ref={ref} className={`${styles.holo} ${className}`} style={style}>{children}</div>
}
