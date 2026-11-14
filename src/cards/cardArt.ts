// The front of a card: a full painting inside a frame of holo foil. The pack's creature bursts out
// from behind the card's own picture (a screenshot on a floating screen, a portrait or an emblem)
// and the words sit right on the art. Sizes are in hundredths of the card's width (`u`).
import { PALETTE } from './palette.ts'
import { PACK_META } from './packMeta.ts'
import { HEAT, mix, paintBackdrop, paintHero, rays, raySeed, rgba, sparkle } from './packArt.ts'
import { MONO, SANS, TITLE, cover, icon, roundRect, spaced, wrap } from './paint.ts'
import { seeded } from './shapes.ts'
import type { CardData, PackId } from './types.ts'

type Ctx = CanvasRenderingContext2D
type Pic = HTMLImageElement
const DEG = Math.PI / 180, TAU = Math.PI * 2

// The foil frame's width, the card's corner and the corner of the window the art shows through.
const FRAME = 4, CORNER = 4.5, WINDOW = 2.2
// Where each pack's creature has its head on the pack's painting, as shares of that painting.
const HEAD: Record<PackId, { x: number; y: number }> = { blog: { x: 0.5, y: 0.355 }, works: { x: 0.5, y: 0.385 }, social: { x: 0.6, y: 0.335 } }

// Where the two plates near the bottom sit, and how tall they are.
const PLATES = 122.6, PLATE_H = 6.8
const nameFont = (size: number) => `italic 900 ${size}px ${SANS}`
const textFont = (size: number) => `500 ${size}px ${SANS}`
function seedOf(id: string) { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }

// Where everything goes on one card. The color painting and the sheen painting share it, so the
// foil lines up with the print.
type Plan = ReturnType<typeof plan>
function plan(ctx: Ctx, card: CardData, art: Pic | null, W: number, H: number) {
  const u = W / 100, rand = seeded(seedOf(card.id)), side = card.no % 2 ? 1 : -1
  const x0 = (FRAME + 3) * u, cw = W - x0 * 2
  // The name as big as fits: on one line if it's short, on two if it isn't.
  let size = 0, lines: string[] = []
  for (const [s, max] of [[10.5, 1], [8.6, 1], [7, 2], [6.2, 2], [5.4, 2]] as const) {
    size = s * u; ctx.font = nameFont(size); lines = wrap(ctx, card.name, cw, max)
    if (!lines[lines.length - 1].endsWith('…')) break
  }
  // The words sit at the bottom, however many lines there are: what the card is about (three lines
  // at most), with what it does on the line above.
  const textSize = 4.1 * u, lh = textSize * 1.34
  ctx.font = textFont(textSize)
  const text = wrap(ctx, card.text, cw, 3), textTop = PLATES * u - 3 * u - text.length * lh, moveY = textTop - 6.4 * u
  // The creature, as big as on its pack or a little bigger, mirrored on every other card. Its head
  // comes out above the card's picture.
  const grow = 1 + rand() * 0.14, pw = 100 * grow * u, ph = pw / 0.55, head = HEAD[card.pack], lean = (side < 0 ? -1 : 1) * (head.x - 0.5) * pw
  const creature = { flip: side < 0, x: W / 2 - 0.5 * pw, y: 37.6 * u - head.y * ph, w: pw, h: ph }
  // The card's picture: a screen for a screenshot (never taller than wide), an emblem for an icon.
  // It sits a little to the side of a creature whose head is off center.
  const shape = art ? Math.min(1.6, Math.max(1, art.width / art.height)) : 0, cx = W / 2 - lean * 0.6
  const hero = art
    ? { kind: 'screen' as const, cx: cx + side * 1.2 * u, cy: 67.4 * u, w: 42 * shape * u, h: 42 * u, turn: side * (2.4 + rand() * 2) * DEG }
    : { kind: 'emblem' as const, cx, cy: 67.5 * u, w: 34 * u, h: 34 * u, turn: 0 }
  const focus = { x: 0.5 + lean / W * 0.5, y: 0.34 }
  // Glints on the art, mostly in its upper half.
  const glints = Array.from({ length: 7 }, () => ({ x: (8 + rand() * 84) * u, y: (8 + rand() ** 1.6 * 76) * u, r: (1.2 + rand() * 2.2) * u }))
  return { u, W, H, x0, cw, side, salt: card.no, name: { size, lines, top: 16.2 * u }, hero, creature, focus, glints, text: { lines: text, size: textSize, lh, top: textTop }, moveY, words: moveY - 9 * u }
}

// ---------- Pieces ----------

function windowPath(p: Plan) {
  const path = new Path2D(), f = FRAME * p.u
  path.roundRect(f, f, p.W - f * 2, p.H - f * 2, WINDOW * p.u)
  return path
}

// The frame around the art: silver foil with a rainbow washed over it and the pack's own little
// shapes scattered along it. `tint` gives the color of a shape from where it is (0 to 1 around the card).
function frame(ctx: Ctx, id: PackId, p: Plan, base: (ctx: Ctx) => void, tint: (t: number) => string) {
  const { u, W, H } = p, ring = new Path2D()
  ring.roundRect(0, 0, W, H, CORNER * u); ring.addPath(windowPath(p))
  ctx.save(); ctx.clip(ring, 'evenodd')
  base(ctx)
  // Shapes every few units along the middle of the frame, a little off line and turned at random.
  const rand = seeded(id.length * 71 + 3), m = FRAME * u / 2, step = 3.1 * u, around = (W + H) * 2
  for (let d = 0; d < around; d += step) {
    const [x, y, along] = d < W ? [d, m, 0] : d < W + H ? [W - m, d - W, 90] : d < W * 2 + H ? [W * 2 + H - d, H - m, 180] : [m, around - d, 270]
    const size = (1 + rand() * 0.9) * u
    ctx.save(); ctx.translate(x + (rand() - 0.5) * u, y + (rand() - 0.5) * u); ctx.rotate((along + (rand() - 0.5) * 70) * DEG)
    ctx.fillStyle = tint(d / around); ctx.beginPath()
    if (id === 'blog') { ctx.moveTo(-size * 1.5, 0); ctx.bezierCurveTo(-size * 0.4, -size, size * 0.9, -size * 0.8, size * 1.5, 0); ctx.bezierCurveTo(size * 0.6, size * 0.1, -size * 0.3, size * 0.6, -size * 1.5, 0) }
    else if (id === 'works') ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4)
    else for (let i = 0; i <= 8; i++) { const a = i * TAU / 8, r = i % 2 ? size * 0.42 : size * 1.25; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) }
    ctx.fill(); ctx.restore()
  }
  ctx.restore()
}

// The creature, behind everything else in the window.
function creature(ctx: Ctx, id: PackId, p: Plan) {
  const c = p.creature
  ctx.save()
  if (c.flip) { ctx.translate(p.W, 0); ctx.scale(-1, 1) }
  ctx.translate(c.x, c.y)
  paintHero(ctx, id, c.w, c.h)
  ctx.restore()
}

// The screen a picture floats on: `paint` fills in the frame around it and the picture itself.
function screen(ctx: Ctx, p: Plan, paint: (ctx: Ctx, part: 'rim' | 'bezel' | 'picture', x: number, y: number, w: number, h: number, r: number) => void) {
  const { u, hero } = p, { w, h } = hero, bezel = 1.5 * u, rim = 0.75 * u
  ctx.save(); ctx.translate(hero.cx, hero.cy); ctx.rotate(hero.turn)
  paint(ctx, 'rim', -w / 2 - bezel - rim, -h / 2 - bezel - rim, w + (bezel + rim) * 2, h + (bezel + rim) * 2, 3.2 * u)
  paint(ctx, 'bezel', -w / 2 - bezel, -h / 2 - bezel, w + bezel * 2, h + bezel * 2, 2.5 * u)
  paint(ctx, 'picture', -w / 2, -h / 2, w, h, 1.3 * u)
  ctx.restore()
}

// The round badge an icon sits on: `ring` is the metal band, `disc` what's inside it.
function emblem(ctx: Ctx, p: Plan, rim: string, ring: string | CanvasGradient, disc: string | CanvasGradient) {
  const { u, hero } = p, r = hero.w / 2
  for (const [radius, fill] of [[r + 0.8 * u, rim], [r, ring], [r - 2.6 * u, rim], [r - 3.2 * u, disc]] as const) {
    ctx.beginPath(); ctx.arc(hero.cx, hero.cy, radius, 0, TAU); ctx.fillStyle = fill; ctx.fill()
  }
}

function name(ctx: Ctx, p: Plan, face: string | CanvasGradient, rim: string, depth: string) {
  const { size, lines, top } = p.name, lh = size * 1.04
  ctx.save()
  ctx.font = nameFont(size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'
  const each = (draw: (line: string, x: number, y: number) => void) => lines.forEach((line, i) => draw(line, p.x0, top + size * 0.82 + i * lh))
  ctx.strokeStyle = depth; ctx.lineWidth = size * 0.24; each((line, x, y) => ctx.strokeText(line, x + size * 0.03, y + size * 0.075))
  ctx.strokeStyle = rim; ctx.lineWidth = size * 0.2; each((line, x, y) => ctx.strokeText(line, x, y))
  ctx.fillStyle = face; each((line, x, y) => ctx.fillText(line, x, y))
  ctx.restore()
}

// A little plate of brushed metal with slanted ends.
function plate(ctx: Ctx, x: number, y: number, w: number, h: number, slant: number, fill: string | CanvasGradient, line: string | null, lw: number) {
  ctx.beginPath(); ctx.moveTo(x + slant, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - slant, y + h); ctx.lineTo(x, y + h); ctx.closePath()
  ctx.lineJoin = 'round'; ctx.fillStyle = fill; ctx.fill()
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke() }
}
function metal(ctx: Ctx, y: number, h: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, '#fbfcff'); g.addColorStop(0.48, '#c9cfdc'); g.addColorStop(0.52, '#b4bbcb'); g.addColorStop(1, '#eceff6')
  return g
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

const titleCase = (word: string) => word[0] + word.slice(1).toLowerCase()

// ---------- The painting ----------

export function paintCardFront(canvas: HTMLCanvasElement, card: CardData, total: number, art: Pic | null) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, id = card.pack
  const c = PALETTE[id], title = TITLE[id], heat = HEAT[id], p = plan(ctx, card, art, W, H), { u, x0, cw, hero } = p
  ctx.clearRect(0, 0, W, H)
  ctx.save(); roundRect(ctx, 0, 0, W, H, CORNER * u); ctx.clip()

  // The art: the pack's burst and its creature, filling the window.
  ctx.save(); ctx.clip(windowPath(p))
  paintBackdrop(ctx, id, W, H, p.focus, p.salt)
  creature(ctx, id, p)

  ctx.save(); ctx.globalCompositeOperation = 'lighter'
  for (const g of p.glints) sparkle(ctx, g.x, g.y, g.r, heat.spark)
  ctx.restore()

  // The card's own picture, with a glow behind it.
  const glow = ctx.createRadialGradient(hero.cx, hero.cy, hero.h * 0.3, hero.cx, hero.cy, hero.w * 0.85)
  glow.addColorStop(0, rgba(heat.hot, 0.55)); glow.addColorStop(1, rgba(heat.hot, 0))
  ctx.fillStyle = glow; ctx.fillRect(0, hero.cy - hero.w, W, hero.w * 2)
  if (hero.kind === 'screen' && art) {
    screen(ctx, p, (ctx, part, x, y, w, h, r) => {
      roundRect(ctx, x, y, w, h, r)
      if (part === 'rim') {
        ctx.save(); ctx.shadowColor = rgba(title.depth, 0.7); ctx.shadowBlur = 5 * u; ctx.shadowOffsetY = 2.6 * u; ctx.fillStyle = title.rim; ctx.fill(); ctx.restore()
      } else if (part === 'bezel') {
        const g = ctx.createLinearGradient(0, y, 0, y + h)
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, title.face[1]); g.addColorStop(1, title.face[2])
        ctx.fillStyle = g; ctx.fill()
      } else {
        ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); cover(ctx, art, x, y, w, h)
        // A streak of glare across the glass.
        const glare = ctx.createLinearGradient(x, y, x + w * 0.7, y + h)
        glare.addColorStop(0, 'rgba(255,255,255,.34)'); glare.addColorStop(0.32, 'rgba(255,255,255,.06)'); glare.addColorStop(0.33, 'rgba(255,255,255,0)')
        ctx.fillStyle = glare; ctx.fillRect(x, y, w, h); ctx.restore()
        ctx.strokeStyle = rgba(title.rim, 0.55); ctx.lineWidth = 0.4 * u; ctx.stroke()
      }
    })
  } else {
    const r = hero.w / 2
    const ring = ctx.createLinearGradient(0, hero.cy - r, 0, hero.cy + r)
    title.face.forEach((color, i) => ring.addColorStop(i / (title.face.length - 1), color))
    const disc = ctx.createRadialGradient(hero.cx, hero.cy - r * 0.2, 0, hero.cx, hero.cy, r)
    disc.addColorStop(0, mix(c.p2, c.p3, 0.35)); disc.addColorStop(0.7, c.p2); disc.addColorStop(1, c.p1)
    ctx.save(); ctx.shadowColor = rgba(title.depth, 0.7); ctx.shadowBlur = 5 * u; ctx.shadowOffsetY = 2.4 * u
    ctx.beginPath(); ctx.arc(hero.cx, hero.cy, r, 0, TAU); ctx.fillStyle = title.rim; ctx.fill(); ctx.restore()
    emblem(ctx, p, title.rim, ring, disc)
    // Light from above on the glass, then the icon.
    ctx.save(); ctx.beginPath(); ctx.arc(hero.cx, hero.cy, r - 3.2 * u, 0, TAU); ctx.clip()
    ctx.beginPath(); ctx.ellipse(hero.cx, hero.cy - r * 0.62, r * 0.95, r * 0.5, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fill(); ctx.restore()
    const size = r * 1.12
    ctx.save(); ctx.shadowColor = rgba(heat.hot, 0.9); ctx.shadowBlur = 3 * u
    icon(ctx, card.art.kind === 'icon' ? card.art.icon : 'quote', hero.cx - size / 2, hero.cy - size / 2, size, '#fff'); ctx.restore()
  }

  // Shade behind the words, at the top and over the lower third.
  const top = ctx.createLinearGradient(0, 0, 0, 34 * u)
  top.addColorStop(0, rgba(c.p1, 0.72)); top.addColorStop(1, rgba(c.p1, 0))
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 34 * u)
  const foot = ctx.createLinearGradient(0, p.words, 0, H)
  foot.addColorStop(0, rgba(c.p1, 0)); foot.addColorStop(0.3, rgba(c.p1, 0.72)); foot.addColorStop(1, rgba(c.p1, 0.93))
  ctx.fillStyle = foot; ctx.fillRect(0, p.words, W, H - p.words)
  ctx.restore()

  // The frame, with a dark line where it meets the art.
  frame(ctx, id, p, ctx => {
    const silver = ctx.createLinearGradient(0, 0, W, H)
    ;['#f8f9fd', '#c2c8d8', '#f3f5fa', '#b6bdcf', '#f0f2f8', '#c6ccdb', '#f8f9fd'].forEach((color, i, all) => silver.addColorStop(i / (all.length - 1), color))
    ctx.fillStyle = silver; ctx.fillRect(0, 0, W, H)
    const wash = ctx.createLinearGradient(0, H, W, 0)
    for (let i = 0; i <= 8; i++) wash.addColorStop(i / 8, `hsla(${(i * 80 + card.no * 47) % 360},95%,72%,.5)`)
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H)
  }, t => `hsla(${(t * 720 + card.no * 47 + 150) % 360},95%,68%,.85)`)
  ctx.strokeStyle = rgba(title.depth, 0.85); ctx.lineWidth = 0.55 * u; ctx.stroke(windowPath(p))
  roundRect(ctx, 0.2 * u, 0.2 * u, W - 0.4 * u, H - 0.4 * u, CORNER * u); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.4 * u; ctx.stroke()

  // Top row: what kind of card it is, and its number with the pack's mark.
  const rowY = 10.2 * u
  ctx.font = `italic 900 ${2.9 * u}px ${SANS}`; ctx.letterSpacing = `${0.35 * u}px`
  const tagW = ctx.measureText(card.tag).width + 5.4 * u
  ctx.letterSpacing = '0px'
  plate(ctx, x0 - 0.6 * u, rowY - 2.7 * u, tagW, 5.4 * u, 1.3 * u, metal(ctx, rowY - 2.7 * u, 5.4 * u), title.rim, 0.5 * u)
  ctx.fillStyle = title.rim; ctx.textBaseline = 'middle'
  spaced(ctx, card.tag, x0 - 0.6 * u + tagW / 2, rowY + 0.15 * u, 0.35 * u)
  const gemR = 3.5 * u, gemX = x0 + cw - gemR + 0.4 * u
  gem(ctx, id, gemX, rowY, gemR, title.rim)
  if (card.stat) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'
    const size = 9.2 * u, right = gemX - gemR - 1.8 * u, base = rowY + size * 0.35
    ctx.font = `italic 900 ${size}px ${SANS}`
    ctx.strokeStyle = title.rim; ctx.lineWidth = size * 0.2; ctx.strokeText(card.stat.value, right, base)
    const face = ctx.createLinearGradient(0, base - size * 0.74, 0, base)
    face.addColorStop(0, '#fff'); face.addColorStop(1, title.face[1])
    ctx.fillStyle = face; ctx.fillText(card.stat.value, right, base)
    const left = right - ctx.measureText(card.stat.value).width - 1.4 * u, words = card.stat.label.split(' '), small = 2.25 * u
    ctx.font = `800 ${small}px ${SANS}`; ctx.textBaseline = 'middle'
    words.forEach((word, i) => {
      const y = rowY + (i - (words.length - 1) / 2) * small * 1.2 + 0.6 * u
      ctx.strokeStyle = title.rim; ctx.lineWidth = small * 0.32; ctx.strokeText(word, left, y)
      ctx.fillStyle = '#fff'; ctx.fillText(word, left, y)
    })
    ctx.restore()
  }

  // The name.
  const face = ctx.createLinearGradient(0, p.name.top, 0, p.name.top + p.name.size * p.name.lines.length)
  face.addColorStop(0, '#ffffff'); face.addColorStop(1, title.face[1])
  name(ctx, p, face, title.rim, title.depth)

  // What the card does: its first link, or for a card without one, what it says about itself.
  ctx.save()
  ctx.shadowColor = rgba(title.depth, 0.9); ctx.shadowBlur = 1.1 * u; ctx.shadowOffsetY = 0.35 * u
  const moveY = p.moveY, move = card.links[0]?.label ?? card.meta.map(titleCase).join(' · ')
  gem(ctx, id, x0 + 2.6 * u, moveY, 2.5 * u, title.rim)
  let moveSize = 5.7 * u
  ctx.font = `italic 800 ${moveSize}px ${SANS}`
  const room = cw - 7.4 * u - (card.links.length ? 8.5 * u : 0)
  while (ctx.measureText(move).width > room && moveSize > 3.6 * u) { moveSize -= 0.2 * u; ctx.font = `italic 800 ${moveSize}px ${SANS}` }
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(move, x0 + 7.4 * u, moveY + 0.2 * u)
  if (card.links.length) {
    // An arrow, as on the page's buttons.
    ctx.strokeStyle = title.face[1]; ctx.lineWidth = 1.1 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const ax = x0 + cw - 0.6 * u
    ctx.beginPath(); ctx.moveTo(ax - 6.4 * u, moveY); ctx.lineTo(ax, moveY); ctx.moveTo(ax - 2.7 * u, moveY - 2.6 * u); ctx.lineTo(ax, moveY); ctx.lineTo(ax - 2.7 * u, moveY + 2.6 * u); ctx.stroke()
  }
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x0, moveY + 4.3 * u, cw, 0.3 * u)

  // What it's about.
  ctx.font = textFont(p.text.size); ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'
  p.text.lines.forEach((line, i) => ctx.fillText(line, x0, p.text.top + i * p.text.lh))
  ctx.restore()

  // Two plates: the card's number, and its date, site or handle.
  const plateY = PLATES * u, plateH = PLATE_H * u, noW = 29 * u, info = card.links.length ? card.meta.join(' · ') : card.foot
  plate(ctx, x0 - 0.6 * u, plateY, noW, plateH, 1.5 * u, metal(ctx, plateY, plateH), title.rim, 0.5 * u)
  plate(ctx, x0 + noW + 0.6 * u, plateY, cw - noW, plateH, 1.5 * u, metal(ctx, plateY, plateH), title.rim, 0.5 * u)
  ctx.fillStyle = title.rim; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
  ctx.font = `700 ${2.5 * u}px ${SANS}`; ctx.fillText('No.', x0 + 2.6 * u, plateY + plateH / 2 + 0.2 * u)
  ctx.font = `800 ${3.4 * u}px ${MONO}`; ctx.fillText(`${String(card.no).padStart(2, '0')}/${String(total).padStart(2, '0')}`, x0 + 8 * u, plateY + plateH / 2 + 0.15 * u)
  let infoSize = 3.1 * u
  ctx.font = `800 ${infoSize}px ${SANS}`; ctx.letterSpacing = `${0.25 * u}px`
  while (ctx.measureText(info).width > cw - noW - 6 * u && infoSize > 2 * u) { infoSize -= 0.15 * u; ctx.font = `800 ${infoSize}px ${SANS}` }
  ctx.letterSpacing = '0px'
  spaced(ctx, info, x0 + noW + 0.6 * u + (cw - noW) / 2 - 0.4 * u, plateY + plateH / 2 + 0.15 * u, 0.25 * u)

  // Fine print along the bottom.
  ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.textBaseline = 'middle'
  ctx.font = `800 ${2.2 * u}px ${SANS}`; spaced(ctx, `${PACK_META[id].title}  ✦  SERIES 01`, x0, 132.8 * u, 0.45 * u, 'left')
  if (info !== card.foot) { ctx.font = `700 ${2.3 * u}px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText(card.foot, x0 + cw, 132.8 * u) }
  ctx.restore()
}

// How each part of the card catches the light in 3D, as a color: red is how much rainbow sheen it
// has, green how rough it is, blue how much like metal (each from 0 to 1). The frame and the burst
// are foil, the glints are shinier still, and the creature, the picture and the words are ink.
const sheen = (rainbow: number, rough: number, metal: number) => `rgb(${Math.round(rainbow * 255)},${Math.round(rough * 255)},${Math.round(metal * 255)})`
const HOLO = sheen(0.75, 0.46, 0.34), RAY = sheen(1, 0.3, 0.58), INK = sheen(0.04, 0.66, 0.03), STAMP = sheen(0.35, 0.2, 0.3)
const CHROME = sheen(1, 0.26, 0.62), MOTIF = sheen(1, 0.42, 0.5), MIRROR = sheen(1, 0.12, 0.45), PLATE = sheen(0.3, 0.34, 0.42)

export function paintCardSheen(canvas: HTMLCanvasElement, card: CardData, art: Pic | null) {
  const ctx = canvas.getContext('2d')!, W = canvas.width, H = canvas.height, id = card.pack
  const p = plan(ctx, card, art, W, H), { u, x0, cw, hero } = p
  ctx.fillStyle = HOLO; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = RAY; rays(ctx, id, W, H, raySeed(id, p.salt), p.focus)
  // The creature is ink over the foil: paint it, then keep only its shape.
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H
  const ink = layer.getContext('2d')!
  creature(ink, id, p)
  ink.globalCompositeOperation = 'source-in'; ink.fillStyle = INK; ink.fillRect(0, 0, W, H)
  ctx.drawImage(layer, 0, 0)
  ctx.fillStyle = MIRROR
  for (const g of p.glints) {
    ctx.beginPath()
    for (let i = 0; i <= 8; i++) { const a = i * TAU / 8, r = i % 2 ? g.r * 0.22 : g.r * 0.8; ctx.lineTo(g.x + Math.cos(a) * r, g.y + Math.sin(a) * r) }
    ctx.fill()
  }
  if (hero.kind === 'screen') screen(ctx, p, (ctx, part, x, y, w, h, r) => { roundRect(ctx, x, y, w, h, r); ctx.fillStyle = part === 'bezel' ? STAMP : INK; ctx.fill() })
  else {
    emblem(ctx, p, INK, STAMP, RAY)
    const size = hero.w / 2 * 1.12
    icon(ctx, card.art.kind === 'icon' ? card.art.icon : 'quote', hero.cx - size / 2, hero.cy - size / 2, size, STAMP)
  }
  // Under the words the foil gives way to ink, so they stay readable when the card catches the light.
  const foot = ctx.createLinearGradient(0, p.words, 0, H)
  foot.addColorStop(0, 'rgba(10,168,8,0)'); foot.addColorStop(0.3, 'rgba(10,168,8,.8)'); foot.addColorStop(1, 'rgba(10,168,8,.95)')
  ctx.fillStyle = foot; ctx.fillRect(0, p.words, W, H - p.words)
  name(ctx, p, STAMP, INK, INK)
  ctx.fillStyle = PLATE
  ctx.fillRect(x0 - 0.6 * u, PLATES * u, cw + 1.2 * u, PLATE_H * u)
  frame(ctx, id, p, ctx => { ctx.fillStyle = CHROME; ctx.fillRect(0, 0, W, H) }, () => MOTIF)
}
