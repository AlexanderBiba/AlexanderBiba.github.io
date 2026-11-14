// The front of a card, laid out like a classic trading card: a frame in the pack's color inside a
// thin ring of holo foil, the name on a metal bar, the art in a window, a line that says what kind
// of card it is, and the words in a box underneath. The pack's creature stands in the window with
// its head coming out over the top edge. A screenshot fills the window behind it, a portrait hangs
// in it as a framed print and an icon sits on a badge. Nothing on the card is tilted.
// Sizes are in hundredths of the card's width (`u`).
import { PALETTE } from './palette.ts'
import { PACK_META } from './packMeta.ts'
import { HEAT, HERO, mix, paintBackdrop, paintHero, rays, raySeed, rgba, sparkle } from './packArt.ts'
import { MONO, SANS, TITLE, cover, icon, roundRect, spaced, wrap } from './paint.ts'
import { seeded } from './shapes.ts'
import type { CardData, CardLink, PackId } from './types.ts'

type Ctx = CanvasRenderingContext2D
type Pic = HTMLImageElement
type Fill = string | CanvasGradient
const DEG = Math.PI / 180, TAU = Math.PI * 2

// The card's corner, the width of the foil ring around it and the corner of what's inside the ring.
const CORNER = 4.5, RING = 2.2, INNER = 3
// Where the burst behind the creature comes from, as shares of the window.
const FOCUS = { x: 0.7, y: 0.42 }
// The size of the card's number at the end of the line under the window.
const STAT = 6.4

const nameFont = (size: number) => `italic 900 ${size}px ${SANS}`
const titleCase = (word: string) => word[0] + word.slice(1).toLowerCase()
function seedOf(id: string) { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }

// Where everything goes on one card. The color painting and the sheen painting share it, so the
// foil lines up with the print.
type Plan = ReturnType<typeof plan>
function plan(ctx: Ctx, card: CardData, art: Pic | null, W: number, H: number) {
  const u = W / 100, id = card.pack, rand = seeded(seedOf(card.id))
  const win = { x: 6 * u, y: 20 * u, w: 88 * u, h: 60 * u, r: 2 * u }
  // A wide picture (a screenshot) fills the window. A square one (a portrait) hangs in it as a print.
  const wide = !!art && art.width / art.height > 1.25
  // The creature, with its head a little under the window's top edge (further right over a screenshot).
  const hero = HERO[id], pw = hero.card.size * W, ph = pw / 0.55, head = hero.head
  const hx = win.x + win.w * (wide ? 0.74 : hero.card.at), hy = win.y + hero.card.drop * u
  const creature = { x: hx - head.x * pw, y: hy - head.y * ph, w: pw, h: ph }
  const glints = Array.from({ length: 4 }, () => ({ x: win.x + (0.4 + rand() * 0.55) * win.w, y: win.y + rand() * win.h * 0.8, r: (1.1 + rand() * 1.6) * u }))
  const print = art && !wide ? { x: win.x + 5 * u, y: win.y + win.h - 30 * u, w: 25 * u } : null
  const badge = !art && card.art.kind === 'icon' && card.art.icon !== 'quote' ? { icon: card.art.icon, cx: win.x + 17 * u, cy: win.y + win.h - 16 * u, r: 11 * u } : null
  // The name on its bar, as big as fits: on one line if it's short, on two if it isn't.
  const bar = { x: 5 * u, y: 6.6 * u, w: (id === 'social' ? 56 : 60) * u, h: 10.4 * u, slant: 2.6 * u }
  let size = 0, lines: string[] = []
  for (const [s, max] of [[6.6, 1], [5.6, 1], [4.4, 2], [3.9, 2]] as const) {
    size = s * u; ctx.font = nameFont(size); lines = wrap(ctx, card.name, bar.w - 8 * u, max)
    if (!lines[lines.length - 1].endsWith('…')) break
  }
  // The line under the window starts with a small plate that says what kind of card this is.
  const lineY = 84.8 * u
  ctx.font = `italic 900 ${2.9 * u}px ${SANS}`; ctx.letterSpacing = `${0.35 * u}px`
  const tag = { x: win.x - 0.4 * u, y: lineY - 2.6 * u, w: ctx.measureText(card.tag).width + 5.4 * u, h: 5.2 * u, slant: 1.3 * u }
  ctx.letterSpacing = '0px'
  // It ends with the card's number, and what's written between the two gets the room that's left.
  let room = win.w - tag.w - 2 * u
  if (card.stat) {
    ctx.font = nameFont(STAT * u); room -= ctx.measureText(card.stat.value).width + 1.2 * u
    ctx.font = `800 ${2.2 * u}px ${SANS}`; room -= ctx.measureText(card.stat.label).width + 2.4 * u
  }
  const box = { x: 6 * u, y: 89.4 * u, w: 88 * u, h: 38.8 * u, r: 2 * u }
  return { u, W, H, salt: card.no, win, wide, creature, glints, print, badge, bar, name: { size, lines }, lineY, tag, room, box }
}

// ---------- Pieces ----------

function windowPath(p: Plan, grow = 0) {
  const path = new Path2D(), { x, y, w, h, r } = p.win
  path.roundRect(x - grow, y - grow, w + grow * 2, h + grow * 2, r + grow)
  return path
}

// Where the creature may show: in the window, and above it as far as the foil ring, so the head
// comes out over the top edge (the name bar is drawn over whatever ends up behind it).
function stagePath(p: Plan) {
  const path = windowPath(p), { x, y, w } = p.win, top = 2.6 * p.u
  path.rect(x, top, w, y + 2 * p.u - top)
  return path
}

// The ring of foil around the card, with the pack's own shape in an even row along it. `base`
// fills the ring and `shapes` is the color of the row.
function ring(ctx: Ctx, id: PackId, p: Plan, base: (ctx: Ctx) => void, shapes: string) {
  const { u, W, H } = p, f = RING * u, path = new Path2D()
  path.roundRect(0, 0, W, H, CORNER * u); path.roundRect(f, f, W - f * 2, H - f * 2, INNER * u)
  ctx.save(); ctx.clip(path, 'evenodd')
  base(ctx)
  const m = f / 2, around = (W + H) * 2, n = Math.round(around / (4.4 * u)), size = f * 0.3
  ctx.fillStyle = shapes
  for (let k = 0; k < n; k++) {
    const d = k / n * around
    const [x, y, along] = d < W ? [d, m, 0] : d < W + H ? [W - m, d - W, 90] : d < W * 2 + H ? [W * 2 + H - d, H - m, 180] : [m, around - d, 270]
    ctx.save(); ctx.translate(x, y); ctx.rotate(along * DEG); ctx.beginPath()
    if (id === 'blog') { ctx.moveTo(-size * 1.7, size * 0.5); ctx.bezierCurveTo(-size * 0.6, -size * 1.5, size * 0.7, -size, size * 1.7, size * 0.4); ctx.bezierCurveTo(size * 0.6, 0, -size * 0.4, size * 0.9, -size * 1.7, size * 0.5) }
    else if (id === 'works') { ctx.rotate(45 * DEG); ctx.rect(-size * 0.75, -size * 0.75, size * 1.5, size * 1.5) }
    else for (let i = 0; i <= 8; i++) { const a = i * TAU / 8, r = i % 2 ? size * 0.42 : size * 1.35; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) }
    ctx.fill(); ctx.restore()
  }
  ctx.restore()
}

function creature(ctx: Ctx, id: PackId, p: Plan) {
  const c = p.creature
  ctx.save(); ctx.clip(stagePath(p)); ctx.translate(c.x, c.y)
  paintHero(ctx, id, c.w, c.h)
  ctx.restore()
}

// A four-pointed glint, as a plain shape (the print uses the glowing `sparkle` instead).
function glint(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i <= 8; i++) { const a = i * TAU / 8, d = i % 2 ? r * 0.22 : r * 0.8; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) }
  ctx.fill()
}

// A square picture in its frame: `paint` fills in the dark rim, the metal frame and the picture.
function print(ctx: Ctx, p: Plan, paint: (part: 'rim' | 'frame' | 'picture', x: number, y: number, w: number, r: number) => void) {
  const { u } = p, { x, y, w } = p.print!
  paint('rim', x - 1.6 * u, y - 1.6 * u, w + 3.2 * u, 3 * u)
  paint('frame', x - 0.9 * u, y - 0.9 * u, w + 1.8 * u, 2.4 * u)
  paint('picture', x, y, w, 1.6 * u)
}

// The round badge an icon sits on: a dark rim, a metal band and the disc inside it.
function badge(ctx: Ctx, p: Plan, rim: Fill, band: Fill, disc: Fill) {
  const { cx, cy, r } = p.badge!
  for (const [radius, fill] of [[r + 0.8 * p.u, rim], [r, band], [r - 2 * p.u, disc]] as const) {
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.fillStyle = fill; ctx.fill()
  }
}

// A little plate of brushed metal with slanted ends.
function plate(ctx: Ctx, at: { x: number; y: number; w: number; h: number; slant: number }, fill: Fill, line: string | null, lw: number) {
  const { x, y, w, h, slant } = at
  ctx.beginPath(); ctx.moveTo(x + slant, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - slant, y + h); ctx.lineTo(x, y + h); ctx.closePath()
  ctx.lineJoin = 'round'; ctx.fillStyle = fill; ctx.fill()
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke() }
}
function metal(ctx: Ctx, y: number, h: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#fbfcff'); g.addColorStop(0.48, '#c9cfdc'); g.addColorStop(0.52, '#b4bbcb'); g.addColorStop(1, '#eceff6')
  return g
}

function name(ctx: Ctx, p: Plan, color: string) {
  const { bar, name: { size, lines }, u } = p
  ctx.font = nameFont(size); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color
  lines.forEach((line, i) => ctx.fillText(line, bar.x + 4.4 * u, bar.y + bar.h / 2 + (i - (lines.length - 1) / 2) * size * 1.05 + 0.2 * u))
}

// The card's number at the end of the line under the window (minutes to read, or the year).
function stat(ctx: Ctx, card: CardData, p: Plan, face: string, rim: string) {
  if (!card.stat) return
  const { u, win, lineY } = p, size = STAT * u, right = win.x + win.w
  ctx.save(); ctx.lineJoin = 'round'; ctx.textAlign = 'right'
  const outlined = (text: string, x: number, y: number, lw: number) => { ctx.strokeStyle = rim; ctx.lineWidth = lw; ctx.strokeText(text, x, y); ctx.fillStyle = face; ctx.fillText(text, x, y) }
  ctx.font = nameFont(size); ctx.textBaseline = 'alphabetic'
  outlined(card.stat.value, right, lineY + size * 0.36, size * 0.2)
  const left = right - ctx.measureText(card.stat.value).width - 1.2 * u
  ctx.font = `800 ${2.2 * u}px ${SANS}`; ctx.textBaseline = 'middle'
  outlined(card.stat.label, left, lineY + 0.5 * u, 0.7 * u)
  ctx.restore()
}

// The pack's mark on a glossy bead.
function gem(ctx: Ctx, id: PackId, x: number, y: number, r: number, rim: string) {
  const title = TITLE[id]
  ctx.beginPath(); ctx.arc(x, y, r + r * 0.16, 0, TAU); ctx.fillStyle = rim; ctx.fill()
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r)
  g.addColorStop(0, title.face[1]); g.addColorStop(0.55, title.face[2]); g.addColorStop(1, title.face[3])
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill()
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.45, r * 0.5, r * 0.26, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill()
  icon(ctx, `pack-${id}`, x - r * 0.68, y - r * 0.68, r * 1.36, rim)
}

// One thing the card does, as a row in the box: the pack's mark, the label of a link and an arrow
// as on the page's buttons. A card without links says what it is instead.
function action(ctx: Ctx, card: CardData, link: CardLink | null, x: number, w: number, y: number, u: number, ink: string) {
  gem(ctx, card.pack, x + 2.6 * u, y, 2.5 * u, ink)
  const label = link?.label ?? card.meta.map(titleCase).join(' · '), room = w - 7.4 * u - (link ? 8.5 * u : 0)
  let size = 5.2 * u
  ctx.font = `italic 800 ${size}px ${SANS}`
  while (ctx.measureText(label).width > room && size > 3.4 * u) { size -= 0.2 * u; ctx.font = `italic 800 ${size}px ${SANS}` }
  ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 7.4 * u, y + 0.2 * u)
  if (link) {
    const ax = x + w - 0.6 * u
    ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = 1.05 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(ax - 6.4 * u, y); ctx.lineTo(ax, y); ctx.moveTo(ax - 2.7 * u, y - 2.7 * u); ctx.lineTo(ax, y); ctx.lineTo(ax - 2.7 * u, y + 2.7 * u); ctx.stroke(); ctx.restore()
  }
  ctx.fillStyle = rgba(ink, 0.22); ctx.fillRect(x, y + 4.1 * u, w, 0.3 * u)
}

// A picture drawn to fill a box. A screenshot keeps its top edge, where a page starts.
function coverTop(ctx: Ctx, img: Pic, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s
  ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, x, y, w, h)
}

// ---------- The painting ----------

export function paintCardFront(canvas: HTMLCanvasElement, card: CardData, total: number, art: Pic | null) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, id = card.pack
  const c = PALETTE[id], title = TITLE[id], heat = HEAT[id], p = plan(ctx, card, art, W, H), { u, win, box } = p
  ctx.clearRect(0, 0, W, H)
  ctx.save(); roundRect(ctx, 0, 0, W, H, CORNER * u); ctx.clip()

  // The frame, in the pack's color, with fine lines across it and light from the top left.
  const body = ctx.createLinearGradient(0, 0, 0, H)
  body.addColorStop(0, mix(c.p2, '#ffffff', 0.08)); body.addColorStop(0.5, mix(c.p2, c.p1, 0.45)); body.addColorStop(1, c.p1)
  ctx.fillStyle = body; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.lineWidth = 0.35 * u; ctx.beginPath()
  for (let d = -H; d < W; d += 2.2 * u) { ctx.moveTo(d, H); ctx.lineTo(d + H, 0) }
  ctx.stroke()
  const shine = ctx.createRadialGradient(W * 0.2, 0, 0, W * 0.2, 0, W * 0.9)
  shine.addColorStop(0, rgba(c.p3, 0.35)); shine.addColorStop(1, rgba(c.p3, 0))
  ctx.fillStyle = shine; ctx.fillRect(0, 0, W, H)

  // The ring of foil around it: silver with a rainbow washed over it.
  ring(ctx, id, p, ctx => {
    const silver = ctx.createLinearGradient(0, 0, W, H)
    ;['#f8f9fd', '#c2c8d8', '#f3f5fa', '#b6bdcf', '#f0f2f8', '#c6ccdb', '#f8f9fd'].forEach((color, i, all) => silver.addColorStop(i / (all.length - 1), color))
    ctx.fillStyle = silver; ctx.fillRect(0, 0, W, H)
    const wash = ctx.createLinearGradient(0, H, W, 0)
    for (let i = 0; i <= 8; i++) wash.addColorStop(i / 8, `hsla(${(i * 80 + card.no * 47) % 360},95%,72%,.55)`)
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H)
  }, 'rgba(255,255,255,.62)')
  ctx.strokeStyle = rgba(title.depth, 0.8); ctx.lineWidth = 0.4 * u
  ctx.beginPath(); ctx.roundRect(RING * u, RING * u, W - RING * 2 * u, H - RING * 2 * u, INNER * u); ctx.stroke()

  // The window: the pack's burst, or the card's screenshot with a darker seat for the creature.
  ctx.save(); ctx.clip(windowPath(p))
  ctx.save(); ctx.translate(win.x, win.y); paintBackdrop(ctx, id, win.w, win.h, FOCUS, p.salt); ctx.restore()
  if (art && p.wide) {
    ctx.fillStyle = '#fff'; ctx.fillRect(win.x, win.y, win.w, win.h); coverTop(ctx, art, win.x, win.y, win.w, win.h)
    const seat = ctx.createLinearGradient(win.x + win.w * 0.42, 0, win.x + win.w, 0)
    seat.addColorStop(0, rgba(c.p1, 0)); seat.addColorStop(1, rgba(c.p1, 0.6))
    ctx.fillStyle = seat; ctx.fillRect(win.x, win.y, win.w, win.h)
  }
  ctx.restore()
  // Its rim, then the creature in front of it.
  ctx.lineWidth = 1.1 * u; ctx.strokeStyle = metal(ctx, win.y, win.h); ctx.stroke(windowPath(p, 0.9 * u))
  ctx.lineWidth = 0.35 * u; ctx.strokeStyle = rgba(title.depth, 0.8); ctx.stroke(windowPath(p, 1.5 * u)); ctx.stroke(windowPath(p))
  creature(ctx, id, p)
  ctx.save(); ctx.clip(stagePath(p)); ctx.globalCompositeOperation = 'lighter'
  for (const g of p.glints) sparkle(ctx, g.x, g.y, g.r, heat.spark)
  ctx.restore()

  // A portrait, as a framed print in the corner of the window.
  if (p.print && art) print(ctx, p, (part, x, y, w, r) => {
    roundRect(ctx, x, y, w, w, r)
    if (part === 'rim') { ctx.save(); ctx.shadowColor = rgba(title.depth, 0.7); ctx.shadowBlur = 4 * u; ctx.shadowOffsetY = 2 * u; ctx.fillStyle = title.rim; ctx.fill(); ctx.restore() }
    else if (part === 'frame') { ctx.fillStyle = metal(ctx, y, w); ctx.fill() }
    else { ctx.save(); ctx.clip(); cover(ctx, art, x, y, w, w); ctx.restore() }
  })
  // An icon, on a badge in the same corner.
  if (p.badge) {
    const { cx, cy, r } = p.badge
    const band = ctx.createLinearGradient(0, cy - r, 0, cy + r)
    title.face.forEach((color, i) => band.addColorStop(i / (title.face.length - 1), color))
    ctx.save(); ctx.shadowColor = rgba(title.depth, 0.7); ctx.shadowBlur = 4 * u; ctx.shadowOffsetY = 2 * u
    ctx.beginPath(); ctx.arc(cx, cy, r + 0.8 * u, 0, TAU); ctx.fillStyle = title.rim; ctx.fill(); ctx.restore()
    badge(ctx, p, title.rim, band, c.p2)
    icon(ctx, p.badge.icon, cx - r * 0.6, cy - r * 0.6, r * 1.2, '#fff')
  }

  // The name on its metal bar.
  ctx.save(); ctx.shadowColor = rgba(title.depth, 0.6); ctx.shadowBlur = 2.4 * u; ctx.shadowOffsetY = 1 * u
  plate(ctx, p.bar, metal(ctx, p.bar.y, p.bar.h), title.rim, 0.55 * u); ctx.restore()
  name(ctx, p, title.rim)

  // Under the window: what kind of card it is, its date, site or handle, and its number.
  const lineY = p.lineY, info = card.links.length ? card.meta.join(' · ') : card.foot, what = info.toUpperCase()
  plate(ctx, p.tag, metal(ctx, p.tag.y, p.tag.h), title.rim, 0.5 * u)
  ctx.font = `italic 900 ${2.9 * u}px ${SANS}`; ctx.fillStyle = title.rim; ctx.textBaseline = 'middle'
  spaced(ctx, card.tag, p.tag.x + p.tag.w / 2, lineY + 0.15 * u, 0.35 * u)
  let whatSize = 2.9 * u
  ctx.font = `800 ${whatSize}px ${SANS}`; ctx.letterSpacing = `${0.3 * u}px`
  while (ctx.measureText(what).width > p.room && whatSize > 1.8 * u) { whatSize -= 0.1 * u; ctx.font = `800 ${whatSize}px ${SANS}` }
  ctx.letterSpacing = '0px'; ctx.fillStyle = 'rgba(255,255,255,.92)'
  spaced(ctx, what, win.x + p.tag.w + 1.6 * u, lineY + 0.15 * u, 0.3 * u, 'left')
  stat(ctx, card, p, '#fff', title.rim)

  // The box with the words: what the card does (a row for each link, two at most), then what it's
  // about. Measured first, so the words sit in the middle of the box however few there are.
  const ink = title.rim, paper = ctx.createLinearGradient(0, box.y, 0, box.y + box.h)
  paper.addColorStop(0, mix('#ffffff', c.c1, 0.1)); paper.addColorStop(1, mix('#ffffff', c.c1, 0.34))
  ctx.save(); ctx.shadowColor = rgba(title.depth, 0.5); ctx.shadowBlur = 2.4 * u; ctx.shadowOffsetY = 1 * u
  roundRect(ctx, box.x, box.y, box.w, box.h, box.r); ctx.fillStyle = paper; ctx.fill(); ctx.restore()
  roundRect(ctx, box.x, box.y, box.w, box.h, box.r); ctx.strokeStyle = ink; ctx.lineWidth = 0.5 * u; ctx.stroke()
  const px = box.x + 4 * u, pw = box.w - 8 * u, rows: (CardLink | null)[] = card.links.length ? card.links.slice(0, 2) : [null]
  const textSize = 3.75 * u, lh = textSize * 1.34
  ctx.font = `italic 500 ${textSize}px ${SANS}`
  const text = wrap(ctx, card.text, pw, rows.length > 1 ? 3 : 4)
  let y = box.y + Math.max(5.6 * u, (box.h - rows.length * 8.6 * u - text.length * lh) / 2 + 3.3 * u)
  for (const link of rows) { action(ctx, card, link, px, pw, y, u, ink); y += 8.6 * u }
  ctx.font = `italic 500 ${textSize}px ${SANS}`; ctx.fillStyle = rgba(ink, 0.86); ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  text.forEach((line, i) => ctx.fillText(line, px, y - 2.2 * u + i * lh))

  // Fine print along the bottom.
  const number = `${String(card.no).padStart(2, '0')}/${String(total).padStart(2, '0')}`
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textBaseline = 'middle'
  ctx.font = `800 ${2.2 * u}px ${SANS}`; spaced(ctx, `${PACK_META[id].title}  ✦  SERIES 01  ✦  ${number}`, box.x, 133 * u, 0.45 * u, 'left')
  if (info !== card.foot) { ctx.font = `700 ${2.3 * u}px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText(card.foot, box.x + box.w, 133 * u) }
  ctx.restore()
}

// How each part of the card catches the light in 3D, as a color: red is how much rainbow sheen it
// has, green how rough it is, blue how much like metal (each from 0 to 1). The ring and the burst
// in the window are foil, the frame is a quieter foil, the glints are shinier still, and the
// creature, the pictures and the box of words are ink.
const sheen = (rainbow: number, rough: number, metal: number) => `rgb(${Math.round(rainbow * 255)},${Math.round(rough * 255)},${Math.round(metal * 255)})`
const BODY = sheen(0.5, 0.52, 0.26), HOLO = sheen(0.75, 0.46, 0.34), RAY = sheen(1, 0.3, 0.58), INK = sheen(0.04, 0.66, 0.03), STAMP = sheen(0.35, 0.2, 0.3)
const CHROME = sheen(1, 0.26, 0.62), MOTIF = sheen(1, 0.42, 0.5), MIRROR = sheen(1, 0.12, 0.45), PLATE = sheen(0.3, 0.34, 0.42)

export function paintCardSheen(canvas: HTMLCanvasElement, card: CardData, art: Pic | null) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, id = card.pack
  const p = plan(ctx, card, art, W, H), { u, win, box } = p
  ctx.fillStyle = BODY; ctx.fillRect(0, 0, W, H)
  // The window: foil with shinier rays, or plain ink under a screenshot.
  ctx.save(); ctx.clip(windowPath(p))
  ctx.fillStyle = p.wide ? INK : HOLO; ctx.fillRect(win.x, win.y, win.w, win.h)
  if (!p.wide) { ctx.translate(win.x, win.y); ctx.fillStyle = RAY; rays(ctx, id, win.w, win.h, raySeed(id, p.salt), FOCUS) }
  ctx.restore()
  ctx.lineWidth = 1.1 * u; ctx.strokeStyle = PLATE; ctx.stroke(windowPath(p, 0.9 * u))
  // The creature is ink over the foil: paint it, then keep only its shape.
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H
  const shape = layer.getContext('2d')!
  creature(shape, id, p)
  shape.globalCompositeOperation = 'source-in'; shape.fillStyle = INK; shape.fillRect(0, 0, W, H)
  ctx.drawImage(layer, 0, 0)
  ctx.save(); ctx.clip(stagePath(p)); ctx.fillStyle = MIRROR
  for (const g of p.glints) glint(ctx, g.x, g.y, g.r)
  ctx.restore()
  if (p.print) print(ctx, p, (part, x, y, w, r) => { roundRect(ctx, x, y, w, w, r); ctx.fillStyle = part === 'frame' ? STAMP : INK; ctx.fill() })
  if (p.badge) {
    const { cx, cy, r } = p.badge
    badge(ctx, p, INK, STAMP, RAY)
    icon(ctx, p.badge.icon, cx - r * 0.6, cy - r * 0.6, r * 1.2, STAMP)
  }
  plate(ctx, p.bar, PLATE, null, 0)
  name(ctx, p, INK)
  plate(ctx, p.tag, PLATE, null, 0)
  stat(ctx, card, p, STAMP, INK)
  // The words stay ink, so they read whichever way the card catches the light.
  roundRect(ctx, box.x, box.y, box.w, box.h, box.r); ctx.fillStyle = INK; ctx.fill()
  ring(ctx, id, p, ctx => { ctx.fillStyle = CHROME; ctx.fillRect(0, 0, W, H) }, MOTIF)
}
