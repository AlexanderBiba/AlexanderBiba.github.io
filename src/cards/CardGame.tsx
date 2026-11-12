'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import Holo from './Holo'
import PackArt, { flapClip } from './PackArt'
import { CardBack, CardFront } from './Card'
import { packRect, packSpacing } from './geometry'
import { MORPH_OVERLAY, wasMorphed } from './handoff'
import { disableMotion, enableMotion } from './motion'
import { CENTER_PACK, PACK_ORDER } from './packMeta'
import type { PackData, PackId } from './types'
import styles from './cards.module.css'

type Stage = 'shelf' | 'tear' | 'opening' | 'cards'
type Vars = CSSProperties & Record<`--${string}`, string | number>
const TEAR_DISTANCE = 0.55
const external = (href: string) => /^https?:/.test(href)

function withTransition(update: () => void) {
  const start = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition
  if (!start || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  start.call(document, () => flushSync(update))
}

export default function CardGame({ packs }: { packs: PackData[] }) {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)
  const [active, setActive] = useState(PACK_ORDER.indexOf(CENTER_PACK))
  const [stage, setStage] = useState<Stage>('shelf')
  const [opened, setOpened] = useState<PackId[]>([])
  const [dealt, setDealt] = useState<PackId[]>([])
  const [inspect, setInspect] = useState<number | null>(null)
  const [intro, setIntro] = useState<'morph' | 'drop' | null>(null)
  const [tear, setTear] = useState<{ from: number; to: number } | null>(null)
  const [nudge, setNudge] = useState(0)
  const swipe = useRef<{ x: number; y: number } | null>(null), suppressClick = useRef(false)
  const tearing = useRef<{ min: number; max: number; rect: DOMRect } | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const grid = useRef<HTMLUListElement>(null), cardsView = useRef<HTMLElement>(null), returnFocus = useRef<HTMLElement | null>(null)
  const pack = packs[active]
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

  useEffect(() => {
    const resize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    resize()
    window.addEventListener('resize', resize)
    setIntro(wasMorphed() ? 'morph' : 'drop')
    later(() => setIntro(null), 1400)
    const html = document.documentElement
    html.classList.add('play-mode')
    // Paint the shelf once underneath the homepage morph's pack, then take that pack away.
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      document.querySelectorAll(`[${MORPH_OVERLAY}]`).forEach(el => el.remove())
      html.classList.remove('play-morph')
    }) })
    // Phones only share their tilt after a tap (iOS asks for permission), so ask on the first one.
    const gesture = () => enableMotion()
    window.addEventListener('touchend', gesture); window.addEventListener('click', gesture)
    const pending = timers.current
    return () => {
      window.removeEventListener('resize', resize); window.removeEventListener('touchend', gesture); window.removeEventListener('click', gesture)
      cancelAnimationFrame(frame); pending.forEach(clearTimeout); html.classList.remove('play-mode', 'play-morph'); disableMotion()
    }
  }, [])

  const goTo = useCallback((index: number) => setActive(Math.max(0, Math.min(packs.length - 1, index))), [packs.length])
  const showCards = useCallback(() => { setStage('cards'); requestAnimationFrame(() => cardsView.current?.scrollTo(0, 0)) }, [])
  const backToShelf = useCallback(() => {
    setInspect(null)
    setDealt(previous => previous.includes(pack.id) ? previous : [...previous, pack.id])
    setStage('shelf'); setTear(null)
  }, [pack.id])
  const tearOpen = useCallback(() => {
    tearing.current = null; setTear(null)
    setStage('opening')
    setOpened(previous => previous.includes(pack.id) ? previous : [...previous, pack.id])
    try { navigator.vibrate?.(12) } catch { /* optional */ }
    later(showCards, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1150)
  }, [pack.id, showCards])
  const openCard = useCallback((index: number, from?: HTMLElement) => { returnFocus.current = from || null; withTransition(() => setInspect(index)) }, [])
  const closeCard = useCallback(() => { withTransition(() => setInspect(null)); requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true })) }, [])
  const step = useCallback((delta: number) => setInspect(index => index === null ? null : (index + delta + pack.cards.length) % pack.cards.length), [pack.cards.length])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (inspect !== null) {
        if (event.key === 'Escape') closeCard()
        else if (event.key === 'ArrowRight') step(1)
        else if (event.key === 'ArrowLeft') step(-1)
        else return
      } else if (stage === 'shelf' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) goTo(active + (event.key === 'ArrowRight' ? 1 : -1))
      else if ((stage === 'tear' || stage === 'cards') && event.key === 'Escape') backToShelf()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [inspect, stage, active, goTo, step, closeCard, backToShelf])

  useEffect(() => { if (inspect !== null) document.querySelector<HTMLElement>(`.${styles.close}`)?.focus({ preventScroll: true }) }, [inspect])

  // Cards fly out of the pack's spot in the middle of the screen to their place in the grid.
  const dealing = stage === 'cards' && !dealt.includes(pack.id)
  useLayoutEffect(() => {
    if (!dealing || !grid.current) return
    const vw = window.innerWidth, vh = window.innerHeight
    grid.current.querySelectorAll<HTMLElement>('[data-slot]').forEach(slot => {
      const rect = slot.getBoundingClientRect()
      slot.style.setProperty('--dx', `${vw / 2 - (rect.left + rect.width / 2)}px`)
      slot.style.setProperty('--dy', `${vh * 0.47 - (rect.top + rect.height / 2)}px`)
    })
  }, [dealing])

  function pointerDown(event: ReactPointerEvent) { swipe.current = { x: event.clientX, y: event.clientY } }
  function pointerUp(event: ReactPointerEvent) {
    const start = swipe.current; swipe.current = null
    if (!start || stage !== 'shelf') return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      goTo(active + (dx < 0 ? 1 : -1))
      suppressClick.current = true
      setTimeout(() => { suppressClick.current = false }, 0)
    }
  }
  function packClick(index: number, keyboard: boolean) {
    if (suppressClick.current) return
    if (stage === 'shelf') {
      if (index !== active) goTo(index)
      else if (opened.includes(pack.id)) showCards()
      else setStage('tear')
    } else if (stage === 'tear' && index === active) {
      if (keyboard) tearOpen()
      else setNudge(n => n + 1)
    }
  }
  function tearDown(event: ReactPointerEvent<HTMLElement>) {
    if (stage !== 'tear') return
    const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width
    tearing.current = { min: x, max: x, rect }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function tearMove(event: ReactPointerEvent<HTMLElement>) {
    const t = tearing.current
    if (!t) return
    const x = Math.max(0, Math.min(1, (event.clientX - t.rect.left) / t.rect.width))
    t.min = Math.min(t.min, x); t.max = Math.max(t.max, x)
    if (t.max - t.min >= TEAR_DISTANCE) tearOpen()
    else if (t.max - t.min > 0.03) setTear({ from: t.min, to: t.max })
  }
  function tearUp() {
    if (!tearing.current) return
    tearing.current = null; setTear(null)
  }

  const rect = viewport && packRect(viewport.w, viewport.h)
  const spacing = viewport && rect ? packSpacing(viewport.w, rect.w) : 0
  const card = inspect !== null ? pack.cards[inspect] : null

  return (
    <main className={styles.game} data-stage={stage}>
      <header className={styles.header} inert={inspect !== null}>
        <Link href="/" className={styles.exit}><span aria-hidden="true">←</span> alexbiba.com</Link>
        <span className={styles.brand}>CARD PACKS</span>
      </header>

      {rect && viewport && <section className={styles.shelf} aria-label="Card packs" inert={stage === 'cards' || inspect !== null} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { swipe.current = null }}>
        <div className={styles.rays} data-pack={pack.id} aria-hidden="true" style={{ left: rect.x + rect.w / 2 - rect.h * 1.2, top: rect.y + rect.h / 2 - rect.h * 1.2, width: rect.h * 2.4, height: rect.h * 2.4 }} />
        {packs.map((item, i) => {
          const off = i - active, focused = off === 0
          const spread = stage === 'shelf' ? off * spacing : off * spacing * 2.6
          const transform = stage === 'shelf'
            ? `translateX(${spread}px) translateZ(${focused ? 0 : -160}px) scale(${focused ? 1 : 0.8}) rotateY(${off * -20}deg)`
            : focused ? 'scale(1.06)' : `translateX(${spread}px) scale(.7)`
          const style: Vars = { left: rect.x, top: rect.y, width: rect.w, height: rect.h, transform, zIndex: 10 - Math.abs(off), '--back': `${-spread}px`, '--i': i }
          const introClass = intro === 'morph' ? (focused ? '' : styles.sideIn) : intro === 'drop' ? styles.dropIn : ''
          const isOpened = opened.includes(item.id)
          return (
            <div key={item.id} className={`${styles.packSlot} ${focused ? styles.focused : styles.aside} ${introClass} ${stage !== 'shelf' && !focused ? styles.gone : ''}`} style={style}>
              {stage === 'opening' && focused ? <div className={styles.opening} data-pack={item.id}>
                <div className={styles.rising}>{[0, 1, 2].map(k => <div key={k} className={styles.risingCard} style={{ '--k': k } as Vars}><CardBack /></div>)}</div>
                <div className={styles.packRest}><PackArt id={item.id} count={item.cards.length} cover={item.cover} opened /></div>
                <span className={styles.burst} />
                <div className={styles.flap} style={{ clipPath: flapClip }}><PackArt id={item.id} count={item.cards.length} cover={item.cover} /></div>
              </div> : <button
                className={styles.packButton}
                tabIndex={stage === 'cards' || (stage !== 'shelf' && !focused) ? -1 : 0}
                aria-label={stage === 'tear' && focused ? `Tear open the ${item.title.toLowerCase()} pack` : `${item.subtitle}: ${item.cards.length} cards${isOpened ? ', opened' : ''}`}
                onClick={event => packClick(i, event.detail === 0)}
                onPointerDown={focused ? tearDown : undefined} onPointerMove={focused ? tearMove : undefined} onPointerUp={focused ? tearUp : undefined} onPointerCancel={focused ? tearUp : undefined}
              >
                <Holo depth={focused ? 1 : 0.4} seed={i * 2.1}><PackArt id={item.id} count={item.cards.length} cover={item.cover} opened={isOpened} /></Holo>
                {isOpened && <span className={styles.openedBadge}>OPENED</span>}
                {focused && stage === 'tear' && <span key={nudge} className={`${styles.tearGuide} ${nudge ? styles.nudge : ''}`} aria-hidden="true"><span className={styles.tearDot} />{tear && <span className={styles.tearCut} style={{ left: `${tear.from * 100}%`, width: `${(tear.to - tear.from) * 100}%` }} />}</span>}
              </button>}
            </div>
          )
        })}
        <div className={styles.caption} style={{ top: rect.y + rect.h * 1.06 + 22 }}>
          {stage === 'shelf' && <>
            <div className={styles.captionRow}>
              <button className={styles.arrow} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous pack">‹</button>
              <h1>{pack.title} PACK</h1>
              <button className={styles.arrow} onClick={() => goTo(active + 1)} disabled={active === packs.length - 1} aria-label="Next pack">›</button>
            </div>
            <p>{pack.subtitle} · {pack.cards.length} cards</p>
            <p className={styles.hint}>{opened.includes(pack.id) ? 'Tap the pack to see your cards' : 'Swipe to browse · tap a pack to pick it'}</p>
            <div className={styles.dots} aria-hidden="true">{packs.map((item, i) => <span key={item.id} className={i === active ? styles.dotOn : ''} />)}</div>
          </>}
          {stage === 'tear' && <>
            <h1>Swipe across the top to tear it open</h1>
            <div className={styles.captionActions}>
              <button className={styles.ghost} onClick={backToShelf}>← All packs</button>
              <button className={styles.ghost} onClick={tearOpen}>Just open it</button>
            </div>
          </>}
        </div>
      </section>}

      {stage === 'cards' && <section className={styles.cardsView} ref={cardsView} aria-label={`${pack.subtitle} cards`} inert={inspect !== null}>
        <div className={styles.cardsHead}>
          <button className={styles.ghost} onClick={backToShelf}>← Packs</button>
          <h1>{pack.title}<span>{pack.cards.length} cards</span></h1>
        </div>
        <ul className={styles.grid} ref={grid}>
          {pack.cards.map((item, i) => (
            <li key={item.id}>
              <button data-slot className={`${styles.slotCard} ${dealing ? styles.deal : ''}`} style={{ '--i': i, viewTransitionName: inspect === i ? undefined : `card-${i}` } as Vars} onClick={event => openCard(i, event.currentTarget)} aria-label={`${item.name}. Open card`}>
                <div className={styles.flipper}>
                  <div className={styles.faceFront}><Holo depth={0.45} seed={i * 1.7}><CardFront card={item} total={pack.cards.length} /></Holo></div>
                  <div className={styles.faceBack}><CardBack /></div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>}

      {card && inspect !== null && <div className={styles.inspect} role="dialog" aria-modal="true" aria-label={card.name}
        onClick={event => { if (event.target === event.currentTarget) closeCard() }}
        onPointerDown={event => { swipe.current = { x: event.clientX, y: event.clientY } }}
        onPointerUp={event => {
          const start = swipe.current; swipe.current = null
          if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) step(event.clientX < start.x ? 1 : -1)
        }}>
        <button className={styles.close} onClick={closeCard} aria-label="Close card">×</button>
        <div className={styles.inspectCard} style={{ viewTransitionName: `card-${inspect}` }}><Holo seed={inspect}><CardFront card={card} total={pack.cards.length} /></Holo></div>
        {card.links.length > 0 && <div className={styles.inspectLinks}>{card.links.map((link, i) => <a key={link.href} className={i === 0 ? styles.primary : styles.ghost} href={link.href} target={external(link.href) ? '_blank' : undefined} rel={external(link.href) ? 'noopener noreferrer' : undefined}>{link.label}{external(link.href) && <span aria-hidden="true"> ↗</span>}</a>)}</div>}
        <div className={styles.inspectNav}><button className={styles.arrow} onClick={() => step(-1)} aria-label="Previous card">‹</button><span>{inspect + 1} / {pack.cards.length}</span><button className={styles.arrow} onClick={() => step(1)} aria-label="Next card">›</button></div>
      </div>}

      <noscript><p className={styles.noscript}>The card packs need JavaScript. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></noscript>
    </main>
  )
}
