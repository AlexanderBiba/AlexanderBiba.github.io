'use client'

import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import styles from './cards.module.css'

// The top card of the stack: it follows your finger, and flicking it up or left goes to the
// next card, down or right goes back. A tap also goes to the next card.
export default function Swipe({ children, onNext, onPrev }: { children: ReactNode; onNext: () => void; onPrev: () => void }) {
  const el = useRef<HTMLDivElement>(null), start = useRef<{ id: number; x: number; y: number; t: number; moved: boolean } | null>(null)
  const place = (dx: number, dy: number, animate: boolean) => {
    if (!el.current) return
    el.current.style.transition = animate ? 'transform .3s cubic-bezier(.2, .9, .3, 1.2)' : 'none'
    el.current.style.transform = dx || dy ? `translate(${dx}px, ${dy}px) rotate(${dx * 0.04}deg)` : ''
  }
  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), moved: false }
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current
    if (!s || s.id !== event.pointerId) return
    const dx = event.clientX - s.x, dy = event.clientY - s.y
    if (!s.moved && Math.hypot(dx, dy) > 6) { s.moved = true; event.currentTarget.setPointerCapture(event.pointerId) }
    if (s.moved) place(dx, dy, false)
  }
  function up(event: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current
    if (!s || s.id !== event.pointerId) return
    start.current = null
    if (!s.moved) { onNext(); return }
    const dx = event.clientX - s.x, dy = event.clientY - s.y, ms = Math.max(1, performance.now() - s.t)
    const forward = Math.min(dx, dy), backward = Math.max(dx, dy)
    place(0, 0, true)
    if (forward < -70 || forward / ms < -0.6) onNext()
    else if (backward > 70 || backward / ms > 0.6) onPrev()
  }
  return <div ref={el} className={styles.swipe} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; place(0, 0, true) }}>{children}</div>
}
