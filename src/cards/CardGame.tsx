'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import Holo from './Holo'
import PackArt, { PackBack, PackEdges, flapClip } from './PackArt'
import Spin from './Spin'
import Deck from './Deck'
import { CardFront } from './Card'
import { packRect, packSpacing, stackRect } from './geometry'
import { MORPH_OVERLAY, wasMorphed } from './handoff'
import { disableMotion, enableMotion } from './motion'
import { CENTER_PACK, PACK_ORDER } from './packMeta'
import type { CardData, PackData } from './types'
import styles from './cards.module.css'

type Stage = 'shelf' | 'tear' | 'opening' | 'stack' | 'closing'
type Vars = CSSProperties & Record<`--${string}`, string | number>
// How far along the tear line (as a share of the pack's width) the finger has to travel.
const TEAR_DISTANCE = 0.6
const OPEN_MS = 1800, CLOSE_MS = 2100
// The picked pack is drawn a little bigger while you tear it.
const PICKED_SCALE = 1.06
const external = (href: string) => /^https?:/.test(href)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The strip hinges on the end you haven't torn yet, so the loose end lifts up and away from the pack.
function flapTransform(progress: number, fromLeft: boolean) {
  return `translateY(${(-progress * 3).toFixed(2)}%) rotate(${((fromLeft ? 1 : -1) * progress * 14).toFixed(2)}deg)`
}
const closedFlap = { transform: 'none', origin: '100% 13%', dir: 1 }

// Drawn rather than typed: the ‹ › glyphs sit off-center in a round button in most fonts.
function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CardLinks({ card }: { card: CardData }) {
  if (!card.links.length) return null
  return <div className={styles.stackLinks}>{card.links.map((link, i) => <a key={link.href} className={i === 0 ? styles.primary : styles.ghost} href={link.href} target={external(link.href) ? '_blank' : undefined} rel={external(link.href) ? 'noopener noreferrer' : undefined}>{link.label}{external(link.href) && <span aria-hidden="true"> ↗</span>}</a>)}</div>
}

export default function CardGame({ packs }: { packs: PackData[] }) {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)
  const [active, setActive] = useState(PACK_ORDER.indexOf(CENTER_PACK))
  const [stage, setStage] = useState<Stage>('shelf')
  const [intro, setIntro] = useState<'morph' | 'drop' | null>(null)
  const [tear, setTear] = useState<{ from: number; to: number; at: number; fromLeft: boolean } | null>(null)
  const [flap, setFlap] = useState(closedFlap)
  const [packFlips, setPackFlips] = useState(0), [packFace, setPackFace] = useState<'front' | 'back'>('front')
  const [nudge, setNudge] = useState(0)
  const [index, setIndex] = useState(0)
  const [deal, setDeal] = useState(0)
  const swipe = useRef<{ x: number; y: number } | null>(null), suppressClick = useRef(false)
  const tearing = useRef<{ start: number; min: number; max: number; rect: DOMRect } | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const pack = packs[active], total = pack.cards.length
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

  const goTo = useCallback((i: number) => setActive(Math.max(0, Math.min(packs.length - 1, i))), [packs.length])
  const pickPack = useCallback(() => { setPackFace('front'); setPackFlips(0); setTear(null); setStage('tear') }, [])
  const tearOpen = useCallback((from = closedFlap) => {
    tearing.current = null; setTear(null)
    setFlap(from); setStage('opening'); setIndex(0)
    try { navigator.vibrate?.([10, 30, 18]) } catch { /* optional */ }
    later(() => setStage('stack'), reducedMotion() ? 0 : OPEN_MS)
  }, [])
  const untear = useCallback(() => {
    setFlap(closedFlap); setStage('closing')
    later(() => { setStage('shelf'); setIndex(0) }, reducedMotion() ? 0 : CLOSE_MS)
  }, [])
  const next = useCallback(() => { if (index < total) setIndex(index + 1) }, [index, total])
  const prev = useCallback(() => { if (index > 0) setIndex(index - 1) }, [index])
  const lookAt = (k: number) => { setIndex(k); setDeal(n => n + 1) }

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const k = event.key
      if (stage === 'shelf' && (k === 'ArrowRight' || k === 'ArrowLeft')) goTo(active + (k === 'ArrowRight' ? 1 : -1))
      else if (stage === 'tear' && k === 'Escape') setStage('shelf')
      else if (stage === 'tear' && k.toLowerCase() === 'f') setPackFlips(n => n + 1)
      else if (stage === 'stack' && k === 'Escape') untear()
      else if (stage === 'stack' && index < total && k === 'ArrowRight') next()
      else if (stage === 'stack' && k === 'ArrowLeft') prev()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [stage, active, index, total, goTo, untear, next, prev])

  function shelfDown(event: ReactPointerEvent) { swipe.current = { x: event.clientX, y: event.clientY } }
  function shelfUp(event: ReactPointerEvent) {
    const start = swipe.current; swipe.current = null
    if (!start || stage !== 'shelf') return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      goTo(active + (dx < 0 ? 1 : -1))
      suppressClick.current = true
      setTimeout(() => { suppressClick.current = false }, 0)
    }
  }
  function packClick(i: number) {
    if (suppressClick.current || stage !== 'shelf') return
    if (i !== active) goTo(i)
    else pickPack()
  }

  // Tearing: drag along the dashed line. The strip peels up from where you started.
  function tearDown(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width
    tearing.current = { start: x, min: x, max: x, rect }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function tearMove(event: ReactPointerEvent<HTMLElement>) {
    const t = tearing.current
    if (!t) return
    const x = Math.max(0, Math.min(1, (event.clientX - t.rect.left) / t.rect.width))
    t.min = Math.min(t.min, x); t.max = Math.max(t.max, x)
    const fromLeft = x >= t.start, progress = Math.min(1, (t.max - t.min) / TEAR_DISTANCE)
    if (progress >= 1) tearOpen({ transform: flapTransform(1, fromLeft), origin: fromLeft ? '100% 13%' : '0% 13%', dir: fromLeft ? 1 : -1 })
    else if (t.max - t.min > 0.02) setTear({ from: t.min, to: t.max, at: x, fromLeft })
  }
  function tearUp(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation()
    if (!tearing.current) return
    const moved = tearing.current.max - tearing.current.min
    tearing.current = null; setTear(null)
    if (moved < 0.02) setNudge(n => n + 1)
  }

  const rect = viewport && packRect(viewport.w, viewport.h)
  const spacing = viewport && rect ? packSpacing(viewport.w, rect.w) : 0
  const progress = tear ? Math.min(1, (tear.to - tear.from) / TEAR_DISTANCE) : 0
  const scene = stage === 'opening' || stage === 'closing'
  const card = index < total ? pack.cards[index] : null
  const stack = viewport && stackRect(viewport.w, viewport.h)
  // Where the picked pack is drawn on screen, after it's scaled up.
  const picked = rect && { w: rect.w * PICKED_SCALE, h: rect.h * PICKED_SCALE, x: rect.x - rect.w * (PICKED_SCALE - 1) / 2, y: rect.y - rect.h * (PICKED_SCALE - 1) / 2 }
  const glow = stage === 'stack' && stack ? { x: stack.x + stack.w / 2, y: stack.y + stack.h / 2, r: stack.h * 1.1 } : rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, r: rect.h * 1.2 } : null

  return (
    <main className={styles.game} data-stage={stage}>
      {/* One bar: it leaves the game on the shelf, and goes back to the packs once you've opened one. */}
      <header className={styles.header}>
        {stage === 'stack'
          ? <button className={styles.exit} onClick={untear}><span aria-hidden="true">←</span> Packs</button>
          : <Link href="/" className={styles.exit}><span aria-hidden="true">←</span> alexbiba.com</Link>}
        <span className={styles.brand}>{stage === 'stack' ? `${pack.title} PACK` : 'CARD PACKS'}</span>
      </header>

      {glow && <div className={styles.rays} data-pack={pack.id} aria-hidden="true" style={{ left: glow.x - glow.r, top: glow.y - glow.r, width: glow.r * 2, height: glow.r * 2 }} />}

      {stack && picked && stage !== 'shelf' && stage !== 'tear' && <Deck key={deal} cards={pack.cards} packId={pack.id} index={index} stage={stage} stack={stack} pack={picked} onNext={next} onPrev={prev} />}

      {rect && viewport && <section className={styles.shelf} aria-label="Card packs" inert={stage === 'stack'} onPointerDown={shelfDown} onPointerUp={shelfUp} onPointerCancel={() => { swipe.current = null }}>
        {packs.map((item, i) => {
          const off = i - active, focused = off === 0
          const spread = stage === 'shelf' ? off * spacing : off * spacing * 2.6
          const transform = stage === 'shelf'
            ? `translateX(${spread}px) translateZ(${focused ? 0 : -160}px) scale(${focused ? 1 : 0.8}) rotateY(${off * -20}deg)`
            : focused ? `scale(${PICKED_SCALE})` : `translateX(${spread}px) scale(.7)`
          const style: Vars = { left: rect.x, top: rect.y, width: rect.w, height: rect.h, transform, zIndex: 10 - Math.abs(off), '--back': `${-spread}px`, '--i': i }
          const introClass = intro === 'morph' ? (focused ? '' : styles.sideIn) : intro === 'drop' ? styles.dropIn : ''
          const names = item.cards.map(c => c.name)
          return (
            <div key={item.id} className={`${styles.packSlot} ${focused ? styles.focused : styles.aside} ${introClass} ${stage !== 'shelf' && !focused ? styles.gone : ''}`} style={style}>
              {focused && scene ? <div className={`${styles.scene} ${stage === 'closing' ? styles.closing : ''}`} data-pack={item.id} style={{ '--flap-from': flap.transform, '--flap-dir': flap.dir } as Vars}>
                <div className={styles.packRest}><PackArt id={item.id} count={item.cards.length} cover={item.cover} opened /><span className={styles.lip} /></div>
                <span className={styles.burst} />
                <span className={styles.seal} />
                <div className={styles.flap} style={{ clipPath: flapClip, transformOrigin: flap.origin }}><PackArt id={item.id} count={item.cards.length} cover={item.cover} /></div>
              </div>
              : focused && stage === 'tear' ? <div className={styles.packStage}>
                <Spin
                  flips={packFlips} disabled={Boolean(tear)} onFace={setPackFace} onTap={() => setNudge(n => n + 1)}
                  thickness={rect.w * 0.06} edges={<PackEdges id={item.id} />}
                  front={<Holo seed={i * 2.1}><div className={styles.tearable}>
                    {tear ? <>
                      <PackArt id={item.id} count={item.cards.length} cover={item.cover} opened />
                      <span className={styles.gapGlow} style={{ opacity: progress }} />
                      <div className={styles.flap} style={{ clipPath: flapClip, transform: flapTransform(progress, tear.fromLeft), transformOrigin: tear.fromLeft ? '100% 13%' : '0% 13%', animation: 'none' }}><PackArt id={item.id} count={item.cards.length} cover={item.cover} /></div>
                    </> : <PackArt id={item.id} count={item.cards.length} cover={item.cover} />}
                    {packFace === 'front' && <span className={styles.tearZone} onPointerDown={tearDown} onPointerMove={tearMove} onPointerUp={tearUp} onPointerCancel={tearUp} aria-hidden="true">
                      <span key={nudge} className={`${styles.tearGuide} ${nudge ? styles.nudge : ''}`}>
                        {!tear && <span className={styles.tearDot} />}
                        {tear && <><span className={styles.tearCut} style={{ left: `${tear.from * 100}%`, width: `${(tear.to - tear.from) * 100}%` }} /><span className={styles.tearSpark} style={{ left: `${tear.at * 100}%` }} /></>}
                      </span>
                    </span>}
                  </div></Holo>}
                  back={<Holo seed={i * 2.1}><PackBack id={item.id} names={names} /></Holo>}
                />
              </div>
              : <button className={styles.packButton} tabIndex={stage === 'shelf' ? 0 : -1} aria-label={`${item.subtitle}: ${item.cards.length} cards`} onClick={() => packClick(i)}>
                <Holo depth={focused ? 1 : 0.4} seed={i * 2.1}><PackArt id={item.id} count={item.cards.length} cover={item.cover} /></Holo>
              </button>}
            </div>
          )
        })}
        <div className={styles.caption} style={{ top: rect.y + rect.h * 1.06 + 22 }}>
          {stage === 'shelf' && <>
            <div className={styles.captionRow}>
              <button className={styles.arrow} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous pack"><Chevron dir="left" /></button>
              <h1>{pack.title} PACK</h1>
              <button className={styles.arrow} onClick={() => goTo(active + 1)} disabled={active === packs.length - 1} aria-label="Next pack"><Chevron dir="right" /></button>
            </div>
            <p>{pack.subtitle} · {pack.cards.length} cards</p>
            <p className={styles.hint}>Swipe to browse · tap a pack to pick it</p>
            <div className={styles.dots} aria-hidden="true">{packs.map((item, i) => <span key={item.id} className={i === active ? styles.dotOn : ''} />)}</div>
          </>}
          {stage === 'tear' && <>
            <h1>{packFace === 'front' ? 'Swipe the top to tear it open' : 'Spin it back to tear it'}</h1>
            <p className={styles.hint}>Drag the pack sideways to spin it</p>
            <div className={styles.captionActions}>
              <button className={styles.ghost} onClick={() => setStage('shelf')}>← All packs</button>
              <button className={styles.ghost} onClick={() => setPackFlips(n => n + 1)}>⟲ Flip</button>
              <button className={styles.ghost} onClick={() => tearOpen()}>Just open it</button>
            </div>
          </>}
        </div>
      </section>}

      {stage === 'stack' && stack && <section className={`${styles.stackView} ${card ? '' : styles.recapMode}`} aria-label={`${pack.subtitle} cards`}>
        {card ? <div className={styles.stackControls} style={{ top: stack.y + stack.h + 22 }}>
          <CardLinks card={card} />
          <div className={styles.stackNav}>
            <button className={styles.arrow} onClick={prev} disabled={index === 0} aria-label="Previous card"><Chevron dir="left" /></button>
            <span className={styles.stackCount}>{index + 1} / {total}</span>
            <button className={styles.arrow} onClick={next} aria-label="Next card"><Chevron dir="right" /></button>
          </div>
          <p className={styles.stackHint}>Swipe the card left for the next one</p>
        </div> : <div className={styles.recap}>
          <h2>You got {total} cards</h2>
          <ul className={styles.recapGrid}>{pack.cards.map((c, k) => <li key={c.id} style={{ '--i': k } as Vars}><button onClick={() => lookAt(k)} aria-label={`Look at ${c.name} again`}><CardFront card={c} total={total} /></button></li>)}</ul>
          <div className={styles.captionActions}>
            <button className={styles.primary} onClick={untear}>Put them back</button>
            <button className={styles.ghost} onClick={() => lookAt(0)}>Look again</button>
          </div>
        </div>}
      </section>}

      <noscript><p className={styles.noscript}>The card packs need JavaScript. <a href="/">Go to the homepage</a> for my posts, projects and links.</p></noscript>
    </main>
  )
}
