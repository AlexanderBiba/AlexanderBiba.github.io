'use client'

import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import Holo from './Holo'
import { CardFront } from './Card'
import { CARD_RATIO } from './geometry'
import type { CardData, PackId } from './types'
import styles from './cards.module.css'

type Rect = { x: number; y: number; w: number; h: number }
type Vars = CSSProperties & Record<`--${string}`, string | number>
export type DeckStage = 'opening' | 'stack' | 'closing'

// How the cards under the top one fan out, by depth.
const FAN = [0, -1.6, 1.3, -0.9]

// The cards you get from a pack. During the opening they start inside the pack (this layer sits
// between the pack's back and its front), slide up out of the torn top, then settle into the
// stack, which is where they stay while you swipe through them. Closing plays that in reverse.
export default function Deck({ cards, packId, index, stage, stack, pack, onNext, onPrev }: {
  cards: CardData[]; packId: PackId; index: number; stage: DeckStage; stack: Rect; pack: Rect; onNext: () => void; onPrev: () => void
}) {
  const layer = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; t: number; dx: number; horizontal: boolean | null } | null>(null)
  const total = cards.length
  const base = stage === 'closing' && index >= total ? 0 : index
  const offscreen = -(stack.x + stack.w * 1.3 + 40)

  // Inside the pack: a real pack is 66 mm wide around a 63 mm card, so the card nearly fills it.
  const cw = pack.w * 0.92, ch = cw / CARD_RATIO
  const sx = stack.x + stack.w / 2, sy = stack.y + stack.h / 2
  const inside = {
    '--fx': `${pack.x + pack.w / 2 - sx}px`,
    '--fy0': `${pack.y + pack.h * 0.17 + ch / 2 - sy}px`,
    '--fy1': `${pack.y + pack.h * 0.13 + ch * 0.06 - sy}px`,
    '--fs': cw / stack.w,
  }

  const el = (n: number) => layer.current?.querySelector<HTMLElement>(`[data-n="${n}"]`) ?? null
  const set = (node: HTMLElement | null, dx: number, dr: number) => {
    if (!node) return
    node.style.transition = 'none'
    node.style.setProperty('--dx', `${dx}px`); node.style.setProperty('--dr', `${dr}deg`)
  }
  const release = (node: HTMLElement | null) => {
    if (!node) return
    node.style.removeProperty('transition'); node.style.removeProperty('--dx'); node.style.removeProperty('--dr')
  }

  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (stage !== 'stack' || event.button !== 0) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), dx: 0, horizontal: null }
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    const dx = event.clientX - d.x, dy = event.clientY - d.y
    if (d.horizontal === null && Math.hypot(dx, dy) > 8) {
      d.horizontal = Math.abs(dx) > Math.abs(dy)
      if (d.horizontal) event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (!d.horizontal) return
    d.dx = dx
    if (dx <= 0) {
      // Pull the top card off to the left.
      release(el(-1)); set(el(0), dx, dx * 0.05)
    } else if (base > 0) {
      // Drag the previous card back in from the left, over the top.
      const p = Math.min(1, dx / (stack.w * 0.9))
      release(el(0)); set(el(-1), -offscreen * p, 18 * p)
    } else {
      set(el(0), dx * 0.25, dx * 0.012)
    }
  }
  function up(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    release(el(0)); release(el(-1))
    if (!d.horizontal) return
    const speed = d.dx / Math.max(1, performance.now() - d.t)
    if (d.dx < -stack.w * 0.22 || speed < -0.45) onNext()
    else if (d.dx > stack.w * 0.22 || speed > 0.45) onPrev()
  }
  function cancel() { drag.current = null; release(el(0)); release(el(-1)) }

  const shown = cards.map((card, i) => ({ card, n: i - base })).filter(({ n }) => (stage === 'stack' ? n >= -1 : n >= 0) && n <= 3)

  return (
    <div ref={layer} className={styles.deck} data-stage={stage}>
      {stage !== 'stack' && <div className={styles.packInside} data-pack={packId} style={{ left: pack.x, top: pack.y, width: pack.w, height: pack.h }} aria-hidden="true" />}
      {shown.map(({ card, n }) => {
        const gone = n < 0
        const style: Vars = {
          left: stack.x, top: stack.y, width: stack.w, height: stack.h, zIndex: gone ? 20 : 10 - n,
          '--x': gone ? `${offscreen}px` : '0px', '--y': gone ? '24px' : `${n * 4}px`,
          '--r': gone ? '-18deg' : `${FAN[n]}deg`, '--s': gone ? 1 : 1 - n * 0.012, '--b': gone ? 1 : 1 - n * 0.16, '--k': Math.max(0, n),
          ...inside,
        }
        const top = n === 0 && stage === 'stack'
        return (
          <div
            key={card.id} data-n={n} className={styles.deckCard} style={style} aria-hidden={!top}
            role={top ? 'group' : undefined} aria-label={top ? `${card.name}, card ${base + 1} of ${total}` : undefined}
            onPointerDown={top ? down : undefined} onPointerMove={top ? move : undefined} onPointerUp={top ? up : undefined} onPointerCancel={top ? cancel : undefined}
          >
            <Holo seed={n} idle={false} depth={top ? 1 : 0}><CardFront card={card} total={total} /></Holo>
          </div>
        )
      })}
    </div>
  )
}
