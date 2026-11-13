// Draws the pack wrappers and cards onto canvases. The same pictures become the 3D textures,
// the homepage morph's stand-in pack and the recap grid, so all three always match.
import { PALETTE } from './palette.ts'
import { PACK_META } from './packMeta.ts'
import { paintBackdrop, paintHero, rays, raySeed, rgba } from './packArt.ts'
import { RIP_Y, rip, teeth, CRIMP } from './shapes.ts'
import type { CardData, IconName, PackId } from './types.ts'

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'
type Ctx = CanvasRenderingContext2D

// Line icons on a 64-unit grid, from the same drawings the site used as SVG.
const ICONS: Record<IconName | `pack-${PackId}`, { d: string[]; fill?: boolean; width?: number }> = {
  quote: { fill: true, d: ['M10 40c0-11 6-19 16-23l2 5c-6 3-9 7-9 12h1c5 0 8 3 8 8s-4 8-9 8c-6 0-9-4-9-10Zm24 0c0-11 6-19 16-23l2 5c-6 3-9 7-9 12h1c5 0 8 3 8 8s-4 8-9 8c-6 0-9-4-9-10Z'] },
  github: { d: ['M22 18 8 32l14 14M42 18l14 14-14 14M36 12 28 52'] },
  linkedin: { d: ['M13 20h38a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V25a5 5 0 0 1 5-5Z', 'M24 20v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5M8 34h48M32 31v6'] },
  x: { width: 5, d: ['M14 12h10l26 40H40ZM50 12 35 29M14 52l15-17'] },
  mail: { d: ['M13 14h38a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z', 'm10 18 22 17 22-17'] },
  chess: { fill: true, d: ['M18 54h30v-6H18Zm3-9h24c0-9-1-17-6-24l-3-4 1-7c-3 0-6 2-8 4-6 2-10 7-12 13l-2 6 4 3 4-3 6-1c-4 4-7 8-8 13Zm8-25a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z'] },
  printer: { d: ['M10 54V10h44v44M6 54h52M10 18h44', 'M30 18v10l2 4 2-4V18', 'M22 54v-8h20v8M26 46v-6h12v6'] },
  'pack-blog': { d: ['M14 50 18 36 42 12l10 10-24 24Zm24-34 10 10M14 50l12-2', 'M34 52h16'] },
  'pack-works': { d: ['M32 8 52 19v26L32 56 12 45V19Z', 'M12 19l20 11 20-11M32 30v26'] },
  'pack-social': { d: ['M10 14h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H26l-10 9v-9h-6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z', 'M18 26h20M18 33h12'] },
}

function icon(ctx: Ctx, name: keyof typeof ICONS, x: number, y: number, size: number, color: string) {
  const { d, fill, width = 4 } = ICONS[name]
  ctx.save()
  ctx.translate(x, y); ctx.scale(size / 64, size / 64)
  ctx.fillStyle = ctx.strokeStyle = color
  ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const path of d) { const p = new Path2D(path); if (fill) ctx.fill(p); else ctx.stroke(p) }
  ctx.restore()
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r)
}

// Draws an image to fill a box, cropped from the top like CSS object-fit: cover with a top position.
function cover(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale, sh = h / scale
  ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, x, y, w, h)
}

function wrap(ctx: Ctx, text: string, width: number, lines: number) {
  const words = text.split(/\s+/), out: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width || !line) { line = next; continue }
    out.push(line); line = word
    if (out.length === lines) break
  }
  if (out.length < lines && line) out.push(line)
  const cut = out.length === lines && out.join(' ').length < text.length
  if (cut) {
    let last = out[lines - 1]
    while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1)
    out[lines - 1] = `${last.replace(/[\s,.;:]+$/, '')}…`
  }
  return out
}

function spaced(ctx: Ctx, text: string, x: number, y: number, spacing: number, align: 'center' | 'left' | 'right' = 'center') {
  ctx.letterSpacing = `${spacing}px`
  // Letter spacing adds a trailing gap, so shift centered text back by half of it.
  ctx.textAlign = align
  ctx.fillText(text, align === 'center' ? x + spacing / 2 : x, y)
  ctx.letterSpacing = '0px'
}

// Each picture is fetched and decoded once: the homepage asks for the first ones while it turns
// into the pack (morph.tsx), and the scene gets the very same ones.
const images = new Map<string, Promise<HTMLImageElement | null>>()
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  let job = images.get(src)
  if (!job) {
    job = new Promise(resolve => {
      const img = new Image()
      img.decoding = 'async'
      // Decoded before it's handed over, off the main thread, so drawing it doesn't stall a frame.
      img.onload = () => { if (img.decode) img.decode().then(() => resolve(img), () => resolve(img)); else resolve(img) }
      // (One that failed gets another try next time.)
      img.onerror = () => { images.delete(src); resolve(null) }
      img.src = src
    })
    images.set(src, job)
  }
  return job
}

// ---------- Packs ----------

// The sealed ends: bare foil with fine ridges pressed into it, tinted by the pack's color.
function crimps(ctx: Ctx, id: PackId, W: number, H: number) {
  const h = H * (CRIMP + 0.015), c = PALETTE[id]
  for (const [y, flip] of [[0, false], [H - h, true]] as const) {
    const foil = ctx.createLinearGradient(0, y, 0, y + h)
    foil.addColorStop(0, '#eef2f8'); foil.addColorStop(0.5, '#aeb6c6'); foil.addColorStop(1, '#e4e9f2')
    ctx.fillStyle = foil; ctx.fillRect(0, y, W, h)
    ctx.fillStyle = c.p2; ctx.globalAlpha = 0.22; ctx.fillRect(0, y, W, h); ctx.globalAlpha = 1
    const stripe = Math.max(2, W * 0.009)
    for (let x = 0; x < W; x += stripe * 2) {
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x, y, stripe, h)
      ctx.fillStyle = 'rgba(20,24,44,.3)'; ctx.fillRect(x + stripe, y, stripe, h)
    }
    const shade = ctx.createLinearGradient(0, flip ? y : y + h, 0, flip ? y - H * 0.02 : y + h + H * 0.02)
    shade.addColorStop(0, 'rgba(0,0,0,.45)'); shade.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = shade; ctx.fillRect(0, flip ? y - H * 0.02 : y + h, W, H * 0.02)
  }
}

// The wrapper's outline: serrated ends, straight sides. `part` keeps only the strip above the
// rip (the bit you tear off), only what's below it, or the whole thing.
export function packOutline(ctx: Ctx, W: number, H: number, part: 'whole' | 'flap' | 'body' = 'whole') {
  const top = teeth(0, 1), bottom = teeth(1, -1).reverse()
  const ripLine = rip.map(([x, y]) => [x, y] as [number, number])
  const points = part === 'flap' ? [...top, ...[...ripLine].reverse()]
    : part === 'body' ? [...ripLine, ...bottom]
      : [...top, ...bottom]
  ctx.beginPath()
  points.forEach(([x, y], i) => i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H))
  ctx.closePath()
}

// Fat slanted lettering with a dark rim and a block of depth under it, each letter set on a
// slight arch. `face` is the letters' color from top to bottom.
function wordmark(ctx: Ctx, text: string, cx: number, cy: number, size: number, o: { face: string[]; rim: string; depth: string; arch?: number; track?: number }) {
  ctx.save()
  ctx.font = `italic 900 ${size}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'
  const letters = [...text], track = (o.track ?? 0.02) * size, arch = o.arch ?? 0
  const widths = letters.map(ch => ctx.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0) + track * (letters.length - 1)
  let x = -total / 2
  const mids = widths.map(w => { const mid = x + w / 2; x += w + track; return mid })
  const each = (draw: (ch: string) => void) => letters.forEach((ch, i) => {
    const t = mids[i] / (total / 2)
    ctx.save(); ctx.translate(cx + mids[i], cy + arch * size * t * t); ctx.rotate(t * arch * 0.8); draw(ch); ctx.restore()
  })
  ctx.strokeStyle = ctx.fillStyle = o.depth; ctx.lineWidth = size * 0.2
  for (let d = 0.09; d > 0; d -= 0.03) each(ch => ctx.strokeText(ch, size * d * 0.35, size * d))
  ctx.strokeStyle = o.rim; ctx.lineWidth = size * 0.17; each(ch => ctx.strokeText(ch, 0, 0))
  ctx.strokeStyle = o.face[0]; ctx.lineWidth = size * 0.065; each(ch => ctx.strokeText(ch, 0, 0))
  const face = ctx.createLinearGradient(0, -size * 0.74, 0, 0.02 * size)
  o.face.forEach((color, i) => face.addColorStop(i / (o.face.length - 1), color))
  ctx.fillStyle = face; each(ch => ctx.fillText(ch, 0, 0))
  ctx.restore()
}

// The colors of each pack's big lettering.
const TITLE: Record<PackId, { face: string[]; rim: string; depth: string }> = {
  blog: { face: ['#ffffff', '#fff1b0', '#ffc24a', '#ff7a3a'], rim: '#3a0828', depth: '#16020f' },
  works: { face: ['#ffffff', '#d4fff8', '#5cf0e0', '#18a8e8'], rim: '#04183a', depth: '#010818' },
  social: { face: ['#ffffff', '#fff4c0', '#ffd24a', '#f29a1c'], rim: '#220a52', depth: '#0c0224' },
}

export function paintPackFront(canvas: HTMLCanvasElement, opts: { id: PackId; count: number }) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100, c = PALETTE[opts.id]
  const meta = PACK_META[opts.id], title = TITLE[opts.id]
  ctx.clearRect(0, 0, W, H)
  paintBackdrop(ctx, opts.id, W, H)
  // Darker at the top, behind the name.
  const head = ctx.createLinearGradient(0, 0.08 * H, 0, 0.27 * H)
  head.addColorStop(0, rgba(c.p1, 0.85)); head.addColorStop(1, rgba(c.p1, 0))
  ctx.fillStyle = head; ctx.fillRect(0, 0.08 * H, W, 0.19 * H)
  paintHero(ctx, opts.id, W, H)
  // A shadow under the lettering at the bottom, so it reads over the art.
  const foot = ctx.createLinearGradient(0, 0.62 * H, 0, 0.93 * H)
  foot.addColorStop(0, rgba(c.p1, 0)); foot.addColorStop(0.55, rgba(c.p1, 0.72)); foot.addColorStop(1, rgba(c.p1, 0.92))
  ctx.fillStyle = foot; ctx.fillRect(0, 0.62 * H, W, 0.31 * H)

  crimps(ctx, opts.id, W, H)

  // Tear line with scissors pointing along it.
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.6 * u; ctx.setLineDash([2.2 * u, 1.6 * u])
  ctx.beginPath(); ctx.moveTo(11 * u, RIP_Y * H); ctx.lineTo(96 * u, RIP_Y * H); ctx.stroke()
  ctx.setLineDash([])
  ctx.translate(4 * u, RIP_Y * H - 3.2 * u); ctx.scale(6.4 * u / 24, 6.4 * u / 24)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(5, 6.5, 3, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(5, 17.5, 3, 0, Math.PI * 2); ctx.stroke()
  ctx.stroke(new Path2D('M7.6 8 22 15.5M7.6 16 22 8.5'))
  ctx.restore()
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `800 ${2.8 * u}px ${MONO}`; ctx.textBaseline = 'alphabetic'
  spaced(ctx, 'TEAR HERE', 96 * u, RIP_Y * H - 1.8 * u, 0.56 * u, 'right')

  // Whose cards these are, under the tear line.
  wordmark(ctx, 'ALEX BIBA', W / 2, 0.2 * H, 8.6 * u, { face: ['#ffffff', '#ffffff', c.chrome], rim: title.rim, depth: title.depth, track: 0.06 })
  ctx.fillStyle = '#fff'; ctx.font = `800 ${2.7 * u}px ${SANS}`; ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 1.2 * u
  spaced(ctx, 'TRADING CARDS  ✦  SERIES 01', W / 2, 0.2 * H + 4.6 * u, 0.9 * u)
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0

  // The pack's name.
  const size = (meta.title.length > 5 ? 21 : 27) * u
  wordmark(ctx, meta.title, W / 2, 0.795 * H, size, { ...title, arch: 0.07 })

  // What's in it, on a ribbon.
  ctx.font = `800 ${3.9 * u}px ${SANS}`; ctx.letterSpacing = `${0.9 * u}px`
  const label = meta.subtitle.toUpperCase(), lw = ctx.measureText(label).width + 9 * u, ly = 0.846 * H, lh = 7.2 * u
  ctx.letterSpacing = '0px'
  ctx.beginPath()
  ctx.moveTo(W / 2 - lw / 2 - 3 * u, ly - lh / 2); ctx.lineTo(W / 2 + lw / 2 + 3 * u, ly - lh / 2); ctx.lineTo(W / 2 + lw / 2, ly); ctx.lineTo(W / 2 + lw / 2 + 3 * u, ly + lh / 2)
  ctx.lineTo(W / 2 - lw / 2 - 3 * u, ly + lh / 2); ctx.lineTo(W / 2 - lw / 2, ly); ctx.closePath()
  const band = ctx.createLinearGradient(0, ly - lh / 2, 0, ly + lh / 2)
  band.addColorStop(0, title.face[2]); band.addColorStop(1, title.face[3])
  ctx.fillStyle = band; ctx.fill()
  ctx.strokeStyle = title.rim; ctx.lineWidth = 0.7 * u; ctx.lineJoin = 'round'; ctx.stroke()
  ctx.fillStyle = title.rim; ctx.textBaseline = 'middle'
  spaced(ctx, label, W / 2, ly + 0.2 * u, 0.9 * u)

  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9; ctx.font = `800 ${2.9 * u}px ${SANS}`
  spaced(ctx, `${opts.count} CARDS  ★  HOLO FOIL INSIDE`, W / 2, 0.895 * H, 0.85 * u)
  ctx.globalAlpha = 1

  sideShading(ctx, W, H)
}

// How each part of the front catches the light on the 3D pack, as a color: red is how much
// rainbow sheen it has, green how rough it is, blue how much like metal (each from 0 to 1).
const sheen = (rainbow: number, rough: number, metal: number) => `rgb(${Math.round(rainbow * 255)},${Math.round(rough * 255)},${Math.round(metal * 255)})`
const FOIL = sheen(0.7, 0.3, 0.45), RAY = sheen(1, 0.16, 0.7), INK = sheen(0.05, 0.62, 0.04), STAMP = sheen(0.25, 0.16, 0.12), BARE = sheen(0.3, 0.3, 0.6)

export function paintPackSheen(canvas: HTMLCanvasElement, id: PackId) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100, meta = PACK_META[id]
  ctx.fillStyle = FOIL; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = RAY; rays(ctx, id, W, H, raySeed(id))
  // The creature is printed in ink over the foil: paint it, then keep only its shape.
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H
  const ink = layer.getContext('2d')!
  paintHero(ink, id, W, H)
  ink.globalCompositeOperation = 'source-in'; ink.fillStyle = INK; ink.fillRect(0, 0, W, H)
  ctx.drawImage(layer, 0, 0)
  // The lettering is stamped in smooth foil, with an ink rim.
  const stamp = { face: [STAMP, STAMP], rim: INK, depth: INK }
  wordmark(ctx, 'ALEX BIBA', W / 2, 0.2 * H, 8.6 * u, { ...stamp, track: 0.06 })
  wordmark(ctx, meta.title, W / 2, 0.795 * H, (meta.title.length > 5 ? 21 : 27) * u, { ...stamp, arch: 0.07 })
  ctx.fillStyle = BARE; ctx.fillRect(0, 0, W, H * (CRIMP + 0.015)); ctx.fillRect(0, H * (1 - CRIMP - 0.015), W, H * (CRIMP + 0.015))
}

// Darker toward the folded sides, a little lighter where the wrapper puffs out.
function sideShading(ctx: Ctx, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(0.09, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(255,255,255,.08)')
  g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(0.72, 'rgba(255,255,255,.06)'); g.addColorStop(0.91, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
}

const BARS = [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1]

export function paintPackBack(canvas: HTMLCanvasElement, opts: { id: PackId; names: string[] }) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100, c = PALETTE[opts.id]
  ctx.clearRect(0, 0, W, H)
  // The same burst as the front, turned down so the list reads.
  paintBackdrop(ctx, opts.id, W, H)
  ctx.fillStyle = rgba(c.p1, 0.5); ctx.fillRect(0, 0, W, H)
  crimps(ctx, opts.id, W, H)
  // The back's center seam.
  const seam = ctx.createLinearGradient(W / 2 - 3 * u, 0, W / 2 + 3 * u, 0)
  seam.addColorStop(0, 'rgba(0,0,0,0)'); seam.addColorStop(0.45, 'rgba(0,0,0,.25)'); seam.addColorStop(0.55, 'rgba(255,255,255,.2)'); seam.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = seam; ctx.fillRect(W / 2 - 3 * u, H * 0.08, 6 * u, H * 0.84)

  ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'
  ctx.font = `800 ${3.6 * u}px ${SANS}`; spaced(ctx, 'ALEX BIBA  ✦  SERIES 01', W / 2, 0.105 * H, 1.1 * u)
  wordmark(ctx, `${PACK_META[opts.id].title} PACK`, W / 2, 0.165 * H + 3.6 * u, 10 * u, TITLE[opts.id])

  const bx = 9 * u, by = 0.25 * H, bw = 82 * u, line = 6.2 * u, bh = 13 * u + opts.names.length * line
  roundRect(ctx, bx, by, bw, bh, 4 * u); ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.5 * u; ctx.stroke()
  ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; ctx.font = `800 ${3 * u}px ${SANS}`
  spaced(ctx, 'WHAT’S INSIDE', bx + 5 * u, by + 7 * u, 0.75 * u, 'left')
  ctx.globalAlpha = 1
  opts.names.forEach((name, i) => {
    const y = by + 13.5 * u + i * line
    ctx.globalAlpha = 0.6; ctx.font = `700 ${3.2 * u}px ${MONO}`; ctx.textAlign = 'left'
    ctx.fillText(String(i + 1).padStart(2, '0'), bx + 5 * u, y)
    ctx.globalAlpha = 1; ctx.font = `650 ${4 * u}px ${SANS}`
    ctx.fillText(wrap(ctx, name, bw - 18 * u, 1)[0], bx + 13 * u, y)
  })

  const total = BARS.reduce((a, b) => a + b, 0) * 0.55 * u + BARS.length * 0.55 * u
  const bxl = W / 2 - total / 2 - 3 * u, byl = 0.8 * H
  ctx.fillStyle = '#fff'; roundRect(ctx, bxl, byl, total + 6 * u, 13 * u, u); ctx.fill()
  let x = bxl + 3 * u
  ctx.fillStyle = '#121420'
  for (const w of BARS) { ctx.fillRect(x, byl + 1.6 * u, w * 0.55 * u, 9.8 * u); x += w * 0.55 * u + 0.55 * u }
  ctx.fillStyle = '#fff'; ctx.font = `700 ${3 * u}px ${MONO}`
  spaced(ctx, 'alexbiba.com/play', W / 2, byl + 16.5 * u, 0.3 * u)
  sideShading(ctx, W, H)
}

// White where the wrapper is, clear outside it: the serrated ends and, for a torn pack, the rip.
export function paintPackMask(canvas: HTMLCanvasElement, part: 'whole' | 'flap' | 'body') {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'; packOutline(ctx, W, H, part); ctx.fill()
}

// ---------- Cards ----------

const symbol = { blog: '●', works: '◆', social: '★' }

// Card proportions match a 63 × 88 mm trading card. Sizes are in hundredths of the width.
export function paintCardFront(canvas: HTMLCanvasElement, card: CardData, total: number, art: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100, c = PALETTE[card.pack]
  ctx.clearRect(0, 0, W, H)
  roundRect(ctx, 0, 0, W, H, 4.5 * u); ctx.save(); ctx.clip()
  const frame = ctx.createLinearGradient(0, 0, W * 0.6, H)
  frame.addColorStop(0, c.c1); frame.addColorStop(1, c.c2)
  ctx.fillStyle = frame; ctx.fillRect(0, 0, W, H)

  const pad = 2.4 * u, ix = pad, iy = pad, iw = W - pad * 2, ih = H - pad * 2
  roundRect(ctx, ix, iy, iw, ih, 2.4 * u); ctx.fillStyle = '#fbf8f1'; ctx.fill()
  const p = 3.2 * u, x0 = ix + p, cw = iw - p * 2
  let y = iy + p

  // Name and tag.
  ctx.textBaseline = 'top'; ctx.textAlign = 'left'
  const tagSize = 3.1 * u
  ctx.font = `800 ${tagSize}px ${SANS}`; ctx.letterSpacing = `${0.37 * u}px`
  const tagW = ctx.measureText(card.tag).width + 4.4 * u, tagH = tagSize + 1.8 * u
  ctx.letterSpacing = '0px'
  roundRect(ctx, x0 + cw - tagW, y + 0.6 * u, tagW, tagH, tagH / 2); ctx.fillStyle = c.c2; ctx.fill()
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
  spaced(ctx, card.tag, x0 + cw - tagW / 2, y + 0.6 * u + tagH / 2 + 0.1 * u, 0.37 * u)
  const nameSize = (card.name.length > 22 ? 5.8 : 7.2) * u
  ctx.font = `800 ${nameSize}px ${SANS}`; ctx.fillStyle = '#181a26'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'
  const nameLines = wrap(ctx, card.name, cw - tagW - 2 * u, 2)
  nameLines.forEach((line, i) => ctx.fillText(line, x0, y + i * nameSize * 1.05))
  y += Math.max(nameLines.length * nameSize * 1.05, tagH + 0.6 * u) + 2.2 * u

  // Art.
  const ah = cw * 10 / 16
  ctx.save(); roundRect(ctx, x0, y, cw, ah, 2.2 * u); ctx.clip()
  if (art) { ctx.fillStyle = '#fff'; ctx.fillRect(x0, y, cw, ah); cover(ctx, art, x0, y, cw, ah) }
  else {
    const bg = ctx.createLinearGradient(x0, y, x0 + cw * 0.6, y + ah)
    bg.addColorStop(0, c.p2); bg.addColorStop(1, c.p1)
    ctx.fillStyle = bg; ctx.fillRect(x0, y, cw, ah)
    const glow = ctx.createRadialGradient(x0 + cw / 2, y + ah * 0.45, 0, x0 + cw / 2, y + ah * 0.45, cw * 0.6)
    glow.addColorStop(0, c.p3); glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 0.85; ctx.fillStyle = glow; ctx.fillRect(x0, y, cw, ah); ctx.globalAlpha = 1
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 3 * u
    for (let s = -ah; s < cw + ah; s += 6 * u) { ctx.beginPath(); ctx.moveTo(x0 + s, y + ah); ctx.lineTo(x0 + s + ah, y); ctx.stroke() }
    const size = cw * 0.34
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowOffsetY = 1.2 * u
    icon(ctx, card.art.kind === 'icon' ? card.art.icon : 'quote', x0 + cw / 2 - size / 2, y + ah / 2 - size / 2, size, '#fff')
    ctx.shadowColor = 'transparent'
  }
  ctx.restore()
  roundRect(ctx, x0, y, cw, ah, 2.2 * u); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.7 * u; ctx.stroke()
  y += ah + 2.2 * u

  // Number and meta.
  ctx.font = `700 ${3.1 * u}px ${MONO}`; ctx.fillStyle = '#6c6f82'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'
  ctx.letterSpacing = `${0.12 * u}px`
  ctx.fillText([`#${String(card.no).padStart(2, '0')}/${String(total).padStart(2, '0')}`, ...card.meta].join('  ·  '), x0, y)
  ctx.letterSpacing = '0px'
  y += 3.1 * u * 1.3 + 2.2 * u

  // Description, then the foot pinned to the bottom.
  const footY = iy + ih - p - 3 * u
  ctx.font = `400 ${4.3 * u}px ${SANS}`; ctx.fillStyle = '#2a2c3a'
  const lh = 4.3 * u * 1.38, room = Math.max(1, Math.floor((footY - 3 * u - y) / lh))
  wrap(ctx, card.text, cw, Math.min(6, room)).forEach((line, i) => ctx.fillText(line, x0, y + i * lh))

  ctx.fillStyle = '#e7e1d4'; ctx.fillRect(x0, footY - 1.8 * u, cw, 0.4 * u)
  ctx.font = `700 ${3 * u}px ${MONO}`; ctx.fillStyle = '#6c6f82'; ctx.textBaseline = 'top'
  ctx.fillText(wrap(ctx, card.foot, cw - 8 * u, 1)[0] ?? '', x0, footY)
  ctx.fillStyle = c.c2; ctx.font = `700 ${4 * u}px ${SANS}`; ctx.textAlign = 'right'
  ctx.fillText(symbol[card.pack], x0 + cw, footY - 0.5 * u)
  ctx.restore()
}

// Where the holo foil goes on a card: the art window, as a white mask.
export function paintCardFoil(canvas: HTMLCanvasElement, card: CardData) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  // The frame is foil too, a little less strongly.
  ctx.fillStyle = '#555'; roundRect(ctx, 0, 0, W, H, 4.5 * u); ctx.fill()
  ctx.fillStyle = '#000'; roundRect(ctx, 2.4 * u, 2.4 * u, W - 4.8 * u, H - 4.8 * u, 2.4 * u); ctx.fill()
  const x0 = 5.6 * u, cw = W - 11.2 * u, nameSize = (card.name.length > 22 ? 5.8 : 7.2) * u
  const y = 5.6 * u + Math.max(nameSize * 1.05, 3.1 * u + 2.4 * u) + 2.2 * u
  ctx.fillStyle = card.art.kind === 'image' ? '#999' : '#fff'
  roundRect(ctx, x0, y, cw, cw * 10 / 16, 2.2 * u); ctx.fill()
}

export function paintCardBack(canvas: HTMLCanvasElement, id: PackId) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, u = W / 100, c = PALETTE[id]
  ctx.clearRect(0, 0, W, H)
  roundRect(ctx, 0, 0, W, H, 4.5 * u); ctx.save(); ctx.clip()
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H)
  g.addColorStop(0, c.p2); g.addColorStop(1, c.p1)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 3 * u
  for (let s = -H; s < W + H; s += 7 * u) { ctx.beginPath(); ctx.moveTo(s, H); ctx.lineTo(s + H, 0); ctx.stroke() }
  roundRect(ctx, 5 * u, 5 * u, W - 10 * u, H - 10 * u, 3 * u); ctx.strokeStyle = c.chrome; ctx.lineWidth = 1.2 * u; ctx.stroke()
  icon(ctx, `pack-${id}`, W / 2 - 18 * u, H / 2 - 24 * u, 36 * u, c.chrome)
  ctx.fillStyle = c.chrome; ctx.font = `800 ${4 * u}px ${SANS}`; ctx.textBaseline = 'middle'
  spaced(ctx, 'ALEX BIBA', W / 2, H / 2 + 20 * u, 1.2 * u)
  ctx.restore()
}
