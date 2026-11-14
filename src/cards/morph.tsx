'use client'

// The page turning into a card pack on the way to /play/, and /play/'s pack standing in for the
// page on the way back. The homepage's half of the way back is in returnMorph.ts.
import works from '../../content/works.json'
import { packRect } from './geometry'
import { MORPH_OVERLAY, markMorphed } from './handoff'
import { CENTER_PACK } from './packMeta'
import { loadImage, loadPackArt, packOutline, packPicture, paintPackFront } from './paint'
import { EASE, RETURN, SHRINK_MS, shapes } from './returnMorph'

const counts = { works: works.length } as Record<string, number>

// The pictures /play/ needs first: the art on the Built pack's cards. Asking for them the moment
// the navbar's card icon is tapped gives them the length of the morph as a head start.
function warmArt() {
  for (const work of works) if (work.image) void loadImage(work.image)
}

const dpr = () => Math.min(window.devicePixelRatio || 1, 2.5)

// The painted pack that stands in for the 3D one while the page changes. `art` draws its front.
function packCanvas(art: (canvas: HTMLCanvasElement) => void) {
  const r = packRect(window.innerWidth, window.innerHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(r.w * dpr()); canvas.height = Math.round(r.h * dpr())
  canvas.setAttribute(MORPH_OVERLAY, '')
  // Styled here: the pages it's shown over don't load the game's stylesheet.
  Object.assign(canvas.style, { position: 'fixed', zIndex: '1000', pointerEvents: 'none', opacity: '0', left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` })
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

// The Built pack's overlay is painted ahead of time, while the homepage is idle, so a tap on the
// navbar's card icon starts the animation at once. The packs' pictures are fetched first (/play/
// gets the same ones); a tap before they've arrived paints the pack with its creature drawn in code.
let primed: { key: string; canvas: HTMLCanvasElement } | null = null
const sizeKey = () => `${window.innerWidth}x${window.innerHeight}@${dpr()}${packPicture(CENTER_PACK) ? '+art' : ''}`
function paintPrimed() {
  if (primed?.key === sizeKey()) return
  primed = { key: sizeKey(), canvas: packCanvas(canvas => paintPackFront(canvas, { id: CENTER_PACK, count: counts[CENTER_PACK] ?? 0 })) }
}
export function primeMorph() {
  if (packPicture(CENTER_PACK)) paintPrimed()
  else void loadPackArt().then(paintPrimed)
}

// Shrinks the visible part of the page into the shape of a card pack, right where /play/ draws
// its center pack, then swaps in the pack's art. `done` runs as soon as the page is fully covered,
// so /play/ starts setting up its 3D scene while the pack finishes its little bounce.
export function morphIntoPack(app: HTMLElement, done: () => void) {
  paintPrimed()
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
