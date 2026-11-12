'use client'

import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import works from '../../content/works.json'
import PackArt from './PackArt'
import { packRect } from './geometry'
import { MORPH_OVERLAY, markMorphed } from './handoff'
import { CENTER_PACK } from './packMeta'
import styles from './cards.module.css'

const counts = { works: works.length } as Record<string, number>

// Shrinks the visible part of the page into the shape of a card pack, right where /play/ draws
// its center pack, then swaps in the real pack art. `done` runs once the pack is fully showing.
export function morphIntoPack(app: HTMLElement, done: () => void) {
  const vw = window.innerWidth, vh = window.innerHeight, r = packRect(vw, vh)
  const box = app.getBoundingClientRect()
  const scale = Math.max(r.w / vw, r.h / vh)
  const cw = r.w / scale, ch = r.h / scale
  const top = -box.top, left = -box.left
  const inset = (t: number, l: number, w: number, h: number, round: number) =>
    `inset(${t}px ${box.width - (l + w)}px ${box.height - (t + h)}px ${l}px round ${round}px)`
  const full = inset(top, left, vw, vh, 0)
  const lifted = inset(top + 10, left + 10, vw - 20, vh - 20, 28)
  const pack = inset(top + (vh - ch) / 2, left + (vw - cw) / 2, cw, ch, (r.w * 0.035) / scale)
  const dx = r.x + r.w / 2 - vw / 2, dy = r.y + r.h / 2 - vh / 2

  const overlay = document.createElement('div')
  overlay.setAttribute(MORPH_OVERLAY, '')
  overlay.className = styles.morphOverlay
  Object.assign(overlay.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` })
  document.body.appendChild(overlay)
  const root = createRoot(overlay)
  flushSync(() => root.render(<PackArt id={CENTER_PACK} count={counts[CENTER_PACK] ?? 0} />))

  document.documentElement.classList.add('play-morph')
  Object.assign(app.style, { transformOrigin: `${left + vw / 2}px ${top + vh / 2}px`, background: '#fff', willChange: 'transform, clip-path' })
  const easing = 'cubic-bezier(.7, 0, .25, 1)'
  const shrink = app.animate([
    { clipPath: full, transform: 'translate(0, 0) scale(1)' },
    { clipPath: lifted, transform: 'translate(0, 0) scale(.96)', offset: 0.2 },
    { clipPath: pack, transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
  ], { duration: 720, easing, fill: 'forwards' })
  overlay.animate([
    { opacity: 0, transform: 'scale(1)' },
    { opacity: 0, transform: 'scale(1)', offset: 0.55 },
    { opacity: 1, transform: 'scale(1)', offset: 0.8 },
    { opacity: 1, transform: 'scale(1.05)', offset: 0.9 },
    { opacity: 1, transform: 'scale(1)' },
  ], { duration: 1000, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
    markMorphed()
    done()
  }, done)
  return () => { shrink.cancel(); overlay.remove(); root.unmount(); document.documentElement.classList.remove('play-morph') }
}
