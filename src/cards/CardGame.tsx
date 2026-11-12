'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CardStage, PICKED_SCALE, type StageState } from './stage3d'
import { packRect, stackRect } from './geometry'
import { MORPH_OVERLAY } from './handoff'
import { disableMotion, enableMotion } from './motion'
import { CENTER_PACK, PACK_ORDER } from './packMeta'
import type { CardData, PackData } from './types'
import styles from './cards.module.css'

type Vars = CSSProperties & Record<`--${string}`, string | number>
const external = (href: string) => /^https?:/.test(href)

// Drawn rather than typed: the ‹ › glyphs sit off-center in a round button in most fonts.
function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CardLinks({ card }: { card: CardData }) {
  if (!card.links.length) return null
  return <div className={styles.stackLinks}>{card.links.map((link, i) => <a key={link.href} className={i === 0 ? styles.primary : styles.ghost} href={link.href} target={external(link.href) ? '_blank' : undefined} rel={external(link.href) ? 'noopener noreferrer' : undefined}>{link.label}{external(link.href) && <span aria-hidden="true"> ↗</span>}</a>)}</div>
}

// The /play/ page: a Three.js scene (stage3d.ts) with the captions, buttons and links on top as
// ordinary HTML, so they stay sharp, clickable and readable by screen readers.
export default function CardGame({ packs }: { packs: PackData[] }) {
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<CardStage | null>(null)
  const [state, setState] = useState<StageState>({ stage: 'shelf', active: PACK_ORDER.indexOf(CENTER_PACK), index: 0, face: 'front', tearing: false, ready: false })
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const pack = packs[state.active], total = pack.cards.length

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('play-mode')
    const resize = () => { setViewport({ w: window.innerWidth, h: window.innerHeight }); stage.current?.resize(window.innerWidth, window.innerHeight) }
    resize()
    window.addEventListener('resize', resize)
    try {
      if (canvas.current) stage.current = new CardStage(canvas.current, packs, setState, PACK_ORDER.indexOf(CENTER_PACK))
    } catch { setFailed(true) }
    // Phones only share their tilt after a tap (iOS asks for permission), so ask on the first one.
    const gesture = () => enableMotion()
    window.addEventListener('touchend', gesture); window.addEventListener('click', gesture)
    return () => {
      window.removeEventListener('resize', resize); window.removeEventListener('touchend', gesture); window.removeEventListener('click', gesture)
      stage.current?.dispose(); stage.current = null
      html.classList.remove('play-mode', 'play-morph'); disableMotion()
      document.querySelectorAll(`[${MORPH_OVERLAY}]`).forEach(el => el.remove())
    }
  }, [packs])

  // The homepage morph leaves its painted pack on screen; take it away once the 3D one is drawn.
  useEffect(() => {
    if (!state.ready && !failed) return
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      document.querySelectorAll(`[${MORPH_OVERLAY}]`).forEach(el => el.remove())
      document.documentElement.classList.remove('play-morph')
    }) })
    return () => cancelAnimationFrame(frame)
  }, [state.ready, failed])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const s = stage.current, k = event.key
      if (!s) return
      if (state.stage === 'shelf' && (k === 'ArrowRight' || k === 'ArrowLeft')) s.goTo(state.active + (k === 'ArrowRight' ? 1 : -1))
      else if (state.stage === 'shelf' && k === 'Enter' && !(event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement)) s.pick()
      else if (state.stage === 'tear' && k === 'Escape') s.backToShelf()
      else if (state.stage === 'tear' && k.toLowerCase() === 'f') s.flip()
      else if (state.stage === 'stack' && k === 'Escape') s.untear()
      else if (state.stage === 'stack' && k === 'ArrowRight') s.next()
      else if (state.stage === 'stack' && k === 'ArrowLeft') s.prev()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [state.stage, state.active])

  const s = stage.current
  const rect = viewport && packRect(viewport.w, viewport.h)
  const stack = viewport && stackRect(viewport.w, viewport.h)
  const card = state.index < total ? pack.cards[state.index] : null
  const inStack = state.stage === 'stack'
  const glow = inStack && stack ? { x: stack.x + stack.w / 2, y: stack.y + stack.h / 2, r: stack.h * 1.1 } : rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, r: rect.h * 1.2 } : null
  const images = s && inStack ? s.cardImages(state.active) : []

  return (
    <main className={styles.game} data-stage={state.stage}>
      {glow && <div className={styles.rays} data-pack={pack.id} aria-hidden="true" style={{ left: glow.x - glow.r, top: glow.y - glow.r, width: glow.r * 2, height: glow.r * 2 }} />}
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />

      {/* One bar: it leaves the game on the shelf, and goes back to the packs once you've opened one. */}
      <header className={styles.header}>
        {inStack
          ? <button className={styles.exit} onClick={() => s?.untear()}><span aria-hidden="true">←</span> Packs</button>
          : <Link href="/" className={styles.exit}><span aria-hidden="true">←</span> alexbiba.com</Link>}
        <span className={styles.brand}>{inStack ? `${pack.title} PACK` : 'CARD PACKS'}</span>
      </header>

      {failed && <div className={styles.fallback}><p>Your browser couldn’t draw the 3D card packs. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></div>}

      {rect && (state.stage === 'shelf' || state.stage === 'tear') && <div className={styles.caption} style={{ top: rect.y + rect.h * PICKED_SCALE + 26 }}>
        {state.stage === 'shelf' && <>
          <div className={styles.captionRow}>
            <button className={styles.arrow} onClick={() => s?.goTo(state.active - 1)} disabled={state.active === 0} aria-label="Previous pack"><Chevron dir="left" /></button>
            <h1>{pack.title} PACK</h1>
            <button className={styles.arrow} onClick={() => s?.goTo(state.active + 1)} disabled={state.active === packs.length - 1} aria-label="Next pack"><Chevron dir="right" /></button>
          </div>
          <p>{pack.subtitle} · {total} cards</p>
          <p className={styles.hint}>Swipe to browse · tap the pack to pick it</p>
          <button className={styles.srOnly} onClick={() => s?.pick()}>Pick the {pack.title.toLowerCase()} pack</button>
          <div className={styles.dots} aria-hidden="true">{packs.map((item, i) => <span key={item.id} className={i === state.active ? styles.dotOn : ''} />)}</div>
        </>}
        {state.stage === 'tear' && <>
          <h1>{state.face === 'front' ? 'Swipe the top to tear it open' : 'Spin it back to tear it'}</h1>
          <p className={styles.hint}>Drag the pack sideways to spin it</p>
          <div className={styles.captionActions}>
            <button className={styles.ghost} onClick={() => s?.backToShelf()}>← All packs</button>
            <button className={styles.ghost} onClick={() => s?.flip()}>⟲ Flip</button>
            <button className={styles.ghost} onClick={() => s?.openNow()}>Just open it</button>
          </div>
        </>}
      </div>}

      {inStack && stack && (card ? <div className={styles.stackControls} style={{ top: stack.y + stack.h + 22 }}>
        <p className={styles.srOnly} aria-live="polite">{card.name}, card {state.index + 1} of {total}. {card.text}</p>
        <CardLinks card={card} />
        <div className={styles.stackNav}>
          <button className={styles.arrow} onClick={() => s?.prev()} disabled={state.index === 0} aria-label="Previous card"><Chevron dir="left" /></button>
          <span className={styles.stackCount}>{state.index + 1} / {total}</span>
          <button className={styles.arrow} onClick={() => s?.next()} aria-label="Next card"><Chevron dir="right" /></button>
        </div>
        <p className={styles.stackHint}>Swipe the card left for the next one</p>
      </div> : <div className={styles.recap}>
        <h2>You got {total} cards</h2>
        <ul className={styles.recapGrid}>{pack.cards.map((c, k) => <li key={c.id} style={{ '--i': k } as Vars}><button onClick={() => s?.show(k)} aria-label={`Look at ${c.name} again`}>{images[k] && <img src={images[k]} alt="" />}</button></li>)}</ul>
        <div className={styles.captionActions}>
          <button className={styles.primary} onClick={() => s?.untear()}>Put them back</button>
          <button className={styles.ghost} onClick={() => s?.show(0)}>Look again</button>
        </div>
      </div>)}

      <noscript><p className={styles.noscript}>The card packs need JavaScript. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></noscript>
    </main>
  )
}
