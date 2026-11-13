'use client'

import posts from '../../content/blog.json'
import works from '../../content/works.json'
import { packRect } from './geometry'
import { MORPH_OVERLAY, markMorphed } from './handoff'
import { AVATAR, CENTER_PACK } from './packMeta'
import { loadImage, packOutline, paintPackFront } from './paint'
import styles from './cards.module.css'

const counts = { works: works.length } as Record<string, number>
// Same cover the /play/ shelf shows on the Built pack: the newest work with a screenshot.
export const cover = [...works].sort((a, b) => b.date.localeCompare(a.date)).find(work => work.image)?.image ?? undefined

// The pictures /play/ needs first: the three packs' covers and the Built pack's card art. Asking
// for them the moment 🎮 is tapped gives them the length of the morph as a head start.
function warmArt() {
  const newestPost = [...posts].sort((a, b) => b.date.localeCompare(a.date)).find(post => post.ogImage)
  for (const src of [newestPost?.ogImage?.url, AVATAR, ...works.map(work => work.image)]) if (src) void loadImage(src)
}

const RETURN = 'data-pack-return'
const EASE = 'cubic-bezier(.7, 0, .25, 1)'
const SHRINK_MS = 720
const dpr = () => Math.min(window.devicePixelRatio || 1, 2.5)

// The painted pack that stands in for the 3D one while the page changes. `art` draws its front.
function packCanvas(art: (canvas: HTMLCanvasElement) => void) {
  const r = packRect(window.innerWidth, window.innerHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(r.w * dpr()); canvas.height = Math.round(r.h * dpr())
  canvas.setAttribute(MORPH_OVERLAY, '')
  canvas.className = styles.morphOverlay
  Object.assign(canvas.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` })
  art(canvas)
  // Cut it to the pack's outline. The fill has to be opaque: whatever style the painting left
  // behind would otherwise set how much of the pack survives.
  const ctx = canvas.getContext('2d')!
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#000'
  ctx.globalCompositeOperation = 'destination-in'; packOutline(ctx, canvas.width, canvas.height); ctx.fill()
  ctx.restore()
  return canvas
}

// The Built pack's overlay is painted ahead of time, while the homepage is idle, so a tap on 🎮
// starts the animation at once.
let primed: { key: string; canvas: HTMLCanvasElement } | null = null
const sizeKey = () => `${window.innerWidth}x${window.innerHeight}@${dpr()}`
export function primeMorph() {
  if (primed?.key === sizeKey()) return
  const paint = (img: HTMLImageElement | null) => (canvas: HTMLCanvasElement) => paintPackFront(canvas, { id: CENTER_PACK, count: counts[CENTER_PACK] ?? 0, cover: img })
  const entry = { key: sizeKey(), canvas: packCanvas(paint(null)) }
  primed = entry
  if (cover) void loadImage(cover).then(img => { if (img && primed === entry) primed = { key: entry.key, canvas: packCanvas(paint(img)) } })
}

// Page clip shapes for the morph, from the full viewport down to the pack's outline.
function shapes(app: HTMLElement) {
  const vw = window.innerWidth, vh = window.innerHeight, r = packRect(vw, vh)
  const box = app.getBoundingClientRect()
  const scale = Math.max(r.w / vw, r.h / vh)
  const cw = r.w / scale, ch = r.h / scale
  const top = -box.top, left = -box.left
  const inset = (t: number, l: number, w: number, h: number, round: number) =>
    `inset(${t}px ${box.width - (l + w)}px ${box.height - (t + h)}px ${l}px round ${round}px)`
  const dx = r.x + r.w / 2 - vw / 2, dy = r.y + r.h / 2 - vh / 2
  Object.assign(app.style, { transformOrigin: `${left + vw / 2}px ${top + vh / 2}px`, background: '#fff', willChange: 'transform, clip-path' })
  return {
    full: { clipPath: inset(top, left, vw, vh, 0), transform: 'translate(0, 0) scale(1)' },
    lifted: { clipPath: inset(top + 10, left + 10, vw - 20, vh - 20, 28), transform: 'translate(0, 0) scale(.96)' },
    pack: { clipPath: inset(top + (vh - ch) / 2, left + (vw - cw) / 2, cw, ch, (r.w * 0.035) / scale), transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
  }
}

// Shrinks the visible part of the page into the shape of a card pack, right where /play/ draws
// its center pack, then swaps in the pack's art. `done` runs as soon as the page is fully covered,
// so /play/ starts setting up its 3D scene while the pack finishes its little bounce.
export function morphIntoPack(app: HTMLElement, done: () => void) {
  primeMorph()
  warmArt()
  const overlay = primed!.canvas
  primed = null
  document.body.appendChild(overlay)
  document.documentElement.classList.add('play-morph')
  const { full, lifted, pack } = shapes(app)
  const shrink = app.animate([full, { ...lifted, offset: 0.2 }, pack], { duration: SHRINK_MS, easing: EASE, fill: 'forwards' })
  overlay.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1, offset: 0.95 }, { opacity: 1 }], { duration: SHRINK_MS, easing: 'ease-out', fill: 'forwards' })
  shrink.finished.then(() => {
    overlay.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' })
    markMorphed()
    done()
  }, done)
  return () => { shrink.cancel(); overlay.remove(); document.documentElement.classList.remove('play-morph') }
}

// /play/ on its way back: a painted copy of the pack in front, from the 3D scene's own texture,
// laid over the 3D pack. The homepage then grows out of it (morphOutOfPack).
export function showReturnPack(front: HTMLCanvasElement | null) {
  const overlay = packCanvas(canvas => { if (front) canvas.getContext('2d')!.drawImage(front, 0, 0, canvas.width, canvas.height) })
  overlay.setAttribute(RETURN, '')
  document.body.appendChild(overlay)
  // In case the page we go to never picks it up.
  setTimeout(() => { if (!overlay.dataset.growing) { overlay.remove(); document.documentElement.classList.remove('play-morph') } }, 10000)
  return overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }).finished
}
export const returnPack = () => document.querySelector<HTMLCanvasElement>(`[${RETURN}]`)

// The homepage growing back out of the pack: the morph into the pack, played backwards.
export function morphOutOfPack(app: HTMLElement) {
  const overlay = returnPack()
  if (!overlay || overlay.dataset.growing) return
  overlay.dataset.growing = '1'
  document.documentElement.classList.add('play-morph')
  const { full, lifted, pack } = shapes(app)
  const grow = app.animate([pack, { ...lifted, offset: 0.8 }, full], { duration: SHRINK_MS, easing: EASE, fill: 'forwards' })
  overlay.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], { duration: SHRINK_MS, easing: 'ease-in', fill: 'forwards' })
  const finish = () => {
    grow.cancel(); overlay.remove()
    Object.assign(app.style, { transformOrigin: '', background: '', willChange: '' })
    document.documentElement.classList.remove('play-morph')
  }
  grow.finished.then(finish, finish)
}
