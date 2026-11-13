'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { CardStage, PICKED_SCALE, type StageState } from './stage3d'
import { packRect, stackRect, zoomRect } from './geometry'
import { MORPH_OVERLAY, wasMorphed } from './handoff'
import { returnPack, showReturnPack } from './morph'
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
  const [state, setState] = useState<StageState>({ stage: 'shelf', active: PACK_ORDER.indexOf(CENTER_PACK), index: 0, face: 'front', tearing: false, ready: false, zoom: false })
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)
  const [failed, setFailed] = useState(false)
  // On the way to the homepage: first the words fade and the pack goes back to its place ('ui'),
  // then the whole scene fades under the painted pack ('all').
  const [exiting, setExiting] = useState<null | 'ui' | 'all'>(null)
  // Arrived through the homepage morph: its painted pack is on screen, so the scene doesn't fade in.
  const [intro, setIntro] = useState(false)
  // The recap grid stays up for a moment after you leave it, minus the cards that fly off as 3D
  // ones: all of them when they're put back ('gather'), or the ones that land on the stack when
  // you tap one ('show', from that card on).
  const [leaving, setLeaving] = useState<null | { mode: 'gather' | 'show'; first: number }>(null)
  const grid = useRef<HTMLUListElement>(null)
  useEffect(() => { if (state.stage !== 'closing') setLeaving(l => l?.mode === 'gather' ? null : l) }, [state.stage])
  useEffect(() => {
    if (leaving?.mode !== 'show') return
    const timer = setTimeout(() => setLeaving(null), 320)
    return () => clearTimeout(timer)
  }, [leaving])
  // Where the recap grid draws each card, for the 3D cards to take over from.
  const gridSpots = () => (grid.current ? [...grid.current.querySelectorAll('li')] : []).map(li => {
    const r = (li.querySelector('img') ?? li).getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }
  })
  const putBack = () => {
    const s = stage.current
    if (!s) return
    const from = gridSpots()
    if (from.length) setLeaving({ mode: 'gather', first: 0 })
    s.untear(from)
  }
  const lookAt = (k: number) => {
    const s = stage.current
    if (!s) return
    const from = gridSpots()
    if (from.length) setLeaving({ mode: 'show', first: k })
    s.show(k, from)
  }
  // The light behind the pack changes color with the pack: the old ones fade out as the new one
  // (the last in the list) fades in, and are dropped once things have been still for a moment.
  // `swap` marks the ones that came in that way; the first one blooms in with the page instead.
  const glowNow = packs[state.active].id
  const [glows, setGlows] = useState([{ id: glowNow, swap: false }])
  if (glows[glows.length - 1].id !== glowNow) setGlows([...glows.filter(g => g.id !== glowNow), glows.find(g => g.id === glowNow) ?? { id: glowNow, swap: true }])
  useEffect(() => {
    if (glows.length < 2) return
    const timer = setTimeout(() => setGlows(g => g.slice(-1)), 700)
    return () => clearTimeout(timer)
  }, [glows])
  // Whether the picked pack has been up close: coming back out, the words under it wait a
  // moment for it to shrink out of their way (see `data-late`).
  const [beenClose, setBeenClose] = useState(false)
  const picked = state.stage === 'tear' || state.stage === 'opening'
  if (picked && state.zoom && !beenClose) setBeenClose(true)
  if (!picked && beenClose) setBeenClose(false)
  const router = useRouter()
  const pack = packs[state.active], total = pack.cards.length

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('play-mode')
    returnPack()?.remove()
    const resize = () => { setViewport({ w: window.innerWidth, h: window.innerHeight }); stage.current?.resize(window.innerWidth, window.innerHeight) }
    resize()
    window.addEventListener('resize', resize)
    const morphed = wasMorphed()
    setIntro(morphed)
    try {
      if (canvas.current) stage.current = new CardStage(canvas.current, packs, setState, { active: PACK_ORDER.indexOf(CENTER_PACK), intro: morphed })
    } catch { setFailed(true) }
    // Phones only share their tilt after a tap (iOS asks for permission), so ask on the first one.
    const gesture = () => enableMotion()
    window.addEventListener('touchend', gesture); window.addEventListener('click', gesture)
    return () => {
      window.removeEventListener('resize', resize); window.removeEventListener('touchend', gesture); window.removeEventListener('click', gesture)
      stage.current?.dispose(); stage.current = null
      // On the way back to the homepage its pack stays up until the homepage has grown out of it.
      html.classList.remove('play-mode'); disableMotion()
      if (!returnPack()) html.classList.remove('play-morph')
      document.querySelectorAll(`[${MORPH_OVERLAY}]:not([data-pack-return])`).forEach(el => el.remove())
    }
  }, [packs])

  // The homepage morph leaves its painted pack on screen; fade it out once the 3D one is drawn
  // underneath, after its bounce.
  useEffect(() => {
    if (!state.ready && !failed) return
    let cancelled = false
    const frame = requestAnimationFrame(() => document.querySelectorAll<HTMLElement>(`[${MORPH_OVERLAY}]:not([data-pack-return])`).forEach(async el => {
      await Promise.all(el.getAnimations().filter(a => a.effect?.getTiming().fill !== 'forwards').map(a => a.finished.catch(() => {})))
      if (cancelled) return
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {})
      el.remove()
      document.documentElement.classList.remove('play-morph')
    }))
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [state.ready, failed])

  // Going back to the homepage plays the morph in reverse: the other packs slide away, a painted
  // copy of this pack takes the 3D one's place, and the homepage grows out of it.
  const leave = async (event: MouseEvent<HTMLAnchorElement>) => {
    const s = stage.current
    if (!s || !state.ready || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    event.preventDefault()
    if (exiting) return
    setExiting('ui')
    await s.exit()
    setExiting('all')
    await Promise.all([showReturnPack(s.packFront(state.active)), new Promise(resolve => setTimeout(resolve, 260))])
    router.push('/')
  }

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const s = stage.current, k = event.key
      if (!s) return
      if (state.stage === 'shelf' && (k === 'ArrowRight' || k === 'ArrowLeft')) s.goTo(state.active + (k === 'ArrowRight' ? 1 : -1))
      else if (state.stage === 'shelf' && k === 'Enter' && !(event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement)) s.pick()
      else if (state.stage === 'tear' && k === 'Escape') { if (state.zoom) s.zoomOut(); else s.backToShelf() }
      else if (state.stage === 'tear' && !state.zoom && k === 'Enter' && !(event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement)) s.zoomIn()
      else if (state.stage === 'tear' && !state.zoom && k.toLowerCase() === 'f') s.flip()
      else if (state.stage === 'stack' && k === 'Escape') putBack()
      else if (state.stage === 'stack' && k === 'ArrowRight') s.next()
      else if (state.stage === 'stack' && k === 'ArrowLeft') s.prev()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [state.stage, state.active, state.zoom])

  const s = stage.current
  const rect = viewport && packRect(viewport.w, viewport.h)
  const stack = viewport && stackRect(viewport.w, viewport.h)
  const card = state.index < total ? pack.cards[state.index] : null
  const inStack = state.stage === 'stack'
  // The buttons under the stack fade out rather than vanish when the recap comes up or the pack
  // closes, so they stay in the page a little longer, showing the card they were last about.
  const underStack = pack.cards[Math.min(state.index, total - 1)]
  const controlsOut = !inStack || !card
  // The same for the words by the pack, while it opens.
  const opening = state.stage === 'opening'
  // Up close the light sits behind the tear line, and the words go above the pack.
  const zoomed = viewport && state.zoom && (state.stage === 'tear' || state.stage === 'opening') ? zoomRect(viewport.w, viewport.h) : null
  const glow = inStack && stack ? { x: stack.x + stack.w / 2, y: stack.y + stack.h / 2, r: stack.h * 1.1 }
    : zoomed && viewport ? { x: viewport.w / 2, y: viewport.h * 0.4, r: zoomed.w * 1.2 }
      : rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, r: rect.h * 1.2 } : null
  // The light is laid out once, where it sits behind the shelf, and moved and resized from there
  // with transforms, which the browser animates without painting it again.
  const glowBase = rect && { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, r: rect.h * 1.2 }
  const glowStyle = glow && glowBase && { left: glowBase.x - glowBase.r, top: glowBase.y - glowBase.r, width: glowBase.r * 2, height: glowBase.r * 2, translate: `${glow.x - glowBase.x}px ${glow.y - glowBase.y}px`, scale: String(glow.r / glowBase.r) }
  const images = s && (inStack || leaving) ? s.cardImages(state.active) : []

  return (
    <main className={styles.game} data-stage={state.stage} data-ready={state.ready || failed || undefined} data-intro={intro || undefined} data-exiting={exiting || undefined} data-tearing={state.tearing || undefined}>
      {glowStyle && glows.map(({ id, swap }) => <div key={id} className={styles.rays} data-pack={id} data-swap={swap || undefined} data-off={id !== glowNow || undefined} aria-hidden="true" style={glowStyle} />)}
      {/* Dims everything but the pack while you tear it. */}
      <div className={styles.dim} aria-hidden="true" />
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />

      {/* One bar: it leaves the game on the shelf, and goes back to the packs once you've opened one. */}
      <header className={styles.header}>
        {inStack
          ? <button key="packs" className={`${styles.exit} ${styles.swap}`} onClick={() => s?.untear()}><span aria-hidden="true">←</span> Packs</button>
          : <Link key="home" href="/" className={`${styles.exit} ${styles.swap}`} onClick={leave}><span aria-hidden="true">←</span> alexbiba.com</Link>}
        <span key={inStack ? 'pack' : 'all'} className={`${styles.brand} ${styles.swap}`}>{inStack ? `${pack.title} PACK` : 'CARD PACKS'}</span>
      </header>

      {failed && <div className={styles.fallback}><p>Your browser couldn’t draw the 3D card packs. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></div>}

      {rect && (state.stage === 'shelf' || state.stage === 'tear' || opening) && <div className={styles.caption} data-out={opening || undefined} inert={opening} style={zoomed && viewport ? { bottom: viewport.h - zoomed.y + 18 } : { top: rect.y + rect.h * PICKED_SCALE + 26 }}>
        {state.stage === 'shelf' && <div key="shelf" className={styles.captionBody}>
          <div className={styles.captionRow}>
            <button className={styles.arrow} onClick={() => s?.goTo(state.active - 1)} disabled={state.active === 0} aria-label="Previous pack"><Chevron dir="left" /></button>
            <h1 key={pack.id} className={styles.swap}>{pack.title} PACK</h1>
            <button className={styles.arrow} onClick={() => s?.goTo(state.active + 1)} disabled={state.active === packs.length - 1} aria-label="Next pack"><Chevron dir="right" /></button>
          </div>
          <p key={pack.id} className={styles.swap}>{pack.subtitle} · {total} cards</p>
          <p className={styles.hint}>Swipe to browse · tap the pack to pick it</p>
          <button className={styles.srOnly} onClick={() => s?.pick()}>Pick the {pack.title.toLowerCase()} pack</button>
          <div className={styles.dots} aria-hidden="true">{packs.map((item, i) => <span key={item.id} className={i === state.active ? styles.dotOn : ''} />)}</div>
        </div>}
        {(state.stage === 'tear' || opening) && !state.zoom && <div key="picked" className={styles.captionBody} data-late={beenClose || undefined}>
          <h1>Tap the pack to open it</h1>
          <p className={styles.hint}>Drag it sideways to spin it around</p>
          <div className={styles.captionActions}>
            <button className={styles.ghost} onClick={() => s?.backToShelf()}>← All packs</button>
            <button className={styles.ghost} onClick={() => s?.flip()}>⟲ Flip</button>
            <button className={styles.ghost} onClick={() => s?.zoomIn()}>Open it</button>
          </div>
        </div>}
        {(state.stage === 'tear' || opening) && state.zoom && <div key="close" className={styles.captionBody} data-late>
          <h1>Swipe to tear it open</h1>
          <div className={styles.captionActions}>
            <button className={styles.ghost} onClick={() => s?.zoomOut()}>← Back</button>
            <button className={styles.ghost} onClick={() => s?.openNow()}>Just open it</button>
          </div>
        </div>}
      </div>}

      {(inStack || state.stage === 'closing') && stack && <div className={styles.stackControls} data-out={controlsOut || undefined} inert={controlsOut} style={{ top: stack.y + stack.h + 22 }}>
        <p className={styles.srOnly} aria-live="polite">{card && `${card.name}, card ${state.index + 1} of ${total}. ${card.text}`}</p>
        <CardLinks key={underStack.id} card={underStack} />
        <div className={styles.stackNav}>
          <button className={styles.arrow} onClick={() => s?.prev()} disabled={state.index === 0} aria-label="Previous card"><Chevron dir="left" /></button>
          <span className={styles.stackCount}>{Math.min(state.index + 1, total)} / {total}</span>
          <button className={styles.arrow} onClick={() => s?.next()} aria-label="Next card"><Chevron dir="right" /></button>
        </div>
        <p className={styles.stackHint}>Swipe the card left for the next one</p>
      </div>}
      {((inStack && stack && !card) || leaving) && <div className={styles.recap} data-leaving={leaving?.mode}>
        <h2>You got {total} cards</h2>
        <ul ref={grid} className={styles.recapGrid}>{pack.cards.map((c, k) => <li key={c.id} style={{ '--i': k } as Vars} data-flying={leaving && k >= leaving.first && (leaving.mode === 'gather' || k <= leaving.first + 3) || undefined}><button onClick={() => lookAt(k)} aria-label={`Look at ${c.name} again`}>{images[k] && <img src={images[k]} alt="" />}</button></li>)}</ul>
        <div className={styles.captionActions}>
          <button className={styles.primary} onClick={putBack}>Put them back</button>
          <button className={styles.ghost} onClick={() => lookAt(0)}>Look again</button>
        </div>
      </div>}

      <noscript><p className={styles.noscript}>The card packs need JavaScript. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></noscript>
    </main>
  )
}
