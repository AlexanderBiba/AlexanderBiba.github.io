// The homepage growing back out of the card pack that /play/ leaves on screen, and the shapes the
// page is clipped to on the way there and back. Every page of the site loads this file with its
// navbar, so it stays small: what paints packs is in morph.tsx, which is fetched later.
import { packRect } from './geometry'

export const RETURN = 'data-pack-return'
export const EASE = 'cubic-bezier(.7, 0, .25, 1)'
export const SHRINK_MS = 720

// Page clip shapes for the morph, from the full viewport down to the pack's outline.
export function shapes(app: HTMLElement) {
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

// The painted pack /play/ leaves in front on its way back (showReturnPack in morph.tsx).
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
