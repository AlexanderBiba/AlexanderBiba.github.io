'use client'

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import styles from './cards.module.css'

type Gesture = { id: number; x: number; y: number; t: number; mode: 'spin' | 'swipe' | null; lastX: number; lastT: number; v: number; base: number }

// A two-sided object you can spin by dragging sideways. It settles on whichever face is
// closest when you let go, carrying the flick's speed. Vertical swipes and taps go to the parent.
export default function Spin({ front, back, flips = 0, disabled = false, onTap, onSwipe, onFace }: {
  front: ReactNode; back: ReactNode; flips?: number; disabled?: boolean
  onTap?: () => void; onSwipe?: (direction: 'up' | 'down') => void; onFace?: (face: 'front' | 'back') => void
}) {
  const inner = useRef<HTMLDivElement>(null), frontFace = useRef<HTMLDivElement>(null), backFace = useRef<HTMLDivElement>(null), gesture = useRef<Gesture | null>(null)
  const angle = useRef(0), lift = useRef(0)
  const [settling, setSettling] = useState(true), [face, setFace] = useState<'front' | 'back'>('front')
  // At rest on the front, the spinner goes flat: Chrome can't hit-test inside a preserve-3d
  // face after it has been turned, which would make the pack's tear strip unreachable.
  const apply = (rest = false) => {
    if (!inner.current) return
    inner.current.style.transformStyle = rest && angle.current === 0 && lift.current === 0 ? 'flat' : ''
    // A flat spinner no longer hides the face turned away, so hide it outright while resting.
    const back = Math.abs(Math.round(angle.current / 180)) % 2 === 1
    if (frontFace.current) frontFace.current.style.visibility = rest && back ? 'hidden' : ''
    if (backFace.current) backFace.current.style.visibility = rest && !back ? 'hidden' : ''
    inner.current.style.transform = lift.current || angle.current ? `translateY(${lift.current}px) rotateZ(${lift.current * -0.03}deg) rotateY(${angle.current}deg)` : 'none'
  }
  const settle = (target: number) => {
    angle.current = target; lift.current = 0; setSettling(true); apply()
    // transitionend doesn't fire when nothing moved, so also come to rest after the transition time.
    setTimeout(settled, 700)
    const showing = Math.abs(Math.round(target / 180)) % 2 === 0 ? 'front' : 'back'
    setFace(showing); onFace?.(showing)
  }
  useEffect(() => { apply(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (flips) settle(Math.round(angle.current / 180) * 180 + 180) }, [flips]) // eslint-disable-line react-hooks/exhaustive-deps

  // Once it has settled, wrap the angle back into 0..359 without animating. Besides keeping the
  // numbers small, a front face left at rotateY(360deg) stops hit-testing its children in Chrome.
  function settled() {
    const el = inner.current
    const wrapped = ((angle.current % 360) + 360) % 360
    if (!el) return
    angle.current = wrapped
    el.style.transition = 'none'; apply(true); void el.offsetWidth; el.style.transition = ''
  }

  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), mode: null, lastX: event.clientX, lastT: performance.now(), v: 0, base: 0 }
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    const dx = event.clientX - g.x, dy = event.clientY - g.y
    if (!g.mode && Math.hypot(dx, dy) > 6) {
      g.mode = Math.abs(dx) >= Math.abs(dy) ? 'spin' : onSwipe ? 'swipe' : 'spin'
      event.currentTarget.setPointerCapture(event.pointerId)
      setSettling(false)
      // Measure from here so the object doesn't jump by the dead zone.
      g.x = g.lastX = event.clientX; g.y = event.clientY; g.lastT = performance.now(); g.base = angle.current
      return
    }
    const now = performance.now()
    if (g.mode === 'spin') {
      g.v = (event.clientX - g.lastX) / Math.max(1, now - g.lastT); g.lastX = event.clientX; g.lastT = now
      angle.current = g.base + dx * 0.75; apply()
    } else if (g.mode === 'swipe') { lift.current = dy; apply() }
  }
  function up(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g || g.id !== event.pointerId) return
    gesture.current = null
    if (!g.mode) { onTap?.(); return }
    if (g.mode === 'spin') { settle(Math.round((angle.current + g.v * 160) / 180) * 180); return }
    const dy = event.clientY - g.y, speed = dy / Math.max(1, performance.now() - g.t)
    if (dy < -70 || speed < -0.6) { onSwipe?.('up'); lift.current = 0 }
    else if (dy > 70 || speed > 0.6) { onSwipe?.('down'); lift.current = 0 }
    settle(Math.round(angle.current / 180) * 180)
  }
  function cancel() { if (gesture.current) { gesture.current = null; settle(Math.round(angle.current / 180) * 180) } }

  return (
    <div className={styles.spin} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
      <div ref={inner} className={`${styles.spinner} ${settling ? styles.settling : ''}`} onTransitionEnd={event => { if (event.target === event.currentTarget) settled() }}>
        {/* Browsers can hit-test a hidden backface, so only the face that's showing takes pointer input. */}
        <div ref={frontFace} className={styles.face} style={{ pointerEvents: face === 'front' ? 'auto' : 'none' }}>{front}</div>
        <div ref={backFace} className={`${styles.face} ${styles.faceBackSide}`} style={{ pointerEvents: face === 'back' ? 'auto' : 'none' }}>{back}</div>
      </div>
    </div>
  )
}
