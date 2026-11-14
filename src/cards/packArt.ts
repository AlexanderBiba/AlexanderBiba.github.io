// The picture on the front of each pack: a burst of light with the pack's creature in front of it.
// Sizes are in hundredths of the pack's width (`u`), so it paints the same at any resolution.
import { PALETTE } from './palette.ts'
import { seeded } from './shapes.ts'
import type { PackId } from './types.ts'

type Ctx = CanvasRenderingContext2D
type Rand = () => number
type Focus = { x: number; y: number }
const TAU = Math.PI * 2

// Where the light bursts from and the creature sits, as shares of the pack's width and height.
export const FOCUS = { x: 0.5, y: 0.43 }

// The hottest color of each pack's burst, and the color of its sparks.
export const HEAT: Record<PackId, { hot: string; spark: string }> = {
  blog: { hot: '#ffe27a', spark: '#fff3c4' },
  works: { hot: '#b8fff4', spark: '#e2fffb' },
  social: { hot: '#fff0b0', spark: '#fff8d8' },
}

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

// A four-pointed glint.
export function sparkle(ctx: Ctx, x: number, y: number, r: number, color = '#fff') {
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1)
  halo.addColorStop(0, rgba('#ffffff', 0.55)); halo.addColorStop(1, rgba('#ffffff', 0))
  ctx.fillStyle = halo; ctx.fillRect(x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2)
  ctx.beginPath(); ctx.moveTo(x + r, y)
  for (let i = 1; i <= 4; i++) { const a = i * TAU / 4; ctx.quadraticCurveTo(x, y, x + Math.cos(a) * r * (i % 2 ? 1.25 : 1), y + Math.sin(a) * r * (i % 2 ? 1.25 : 1)) }
  ctx.fillStyle = color; ctx.fill()
}

// A curved streak that swells in the middle and comes to a point at both ends, around (cx, cy).
function swoosh(ctx: Ctx, cx: number, cy: number, r: number, a0: number, a1: number, thick: number, grow = 0) {
  const n = 30, at = (t: number, k: number) => { const a = a0 + (a1 - a0) * t, d = r * (1 + grow * t) + k; ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d) }
  ctx.beginPath()
  for (let i = 0; i <= n; i++) at(i / n, thick * Math.sin(Math.PI * (i / n)) ** 0.8)
  for (let i = n; i >= 0; i--) at(i / n, -thick * 0.2 * Math.sin(Math.PI * (i / n)))
  ctx.closePath(); ctx.fill()
}

// A jagged bolt of lightning from one point to another, with one fork.
export function bolt(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, rand: Rand, w: number, color: string, fork = true) {
  const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len, n = 7
  const pts: [number, number][] = [[x0, y0]]
  for (let i = 1; i < n; i++) { const t = i / n, off = (rand() - 0.5) * len * 0.24; pts.push([x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off]) }
  pts.push([x1, y1])
  ctx.save()
  ctx.lineJoin = 'miter'; ctx.lineCap = 'round'
  for (const [width, style] of [[w * 5, rgba(color, 0.18)], [w * 2.4, rgba(color, 0.5)], [w, '#fff']] as const) {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.lineWidth = width; ctx.strokeStyle = style; ctx.stroke()
  }
  ctx.restore()
  if (fork) { const [mx, my] = pts[3], a = Math.atan2(y1 - y0, x1 - x0) + (rand() > 0.5 ? 0.7 : -0.7); bolt(ctx, mx, my, mx + Math.cos(a) * len * 0.35, my + Math.sin(a) * len * 0.35, rand, w * 0.6, color, false) }
}

// The rays of the burst: wedges of uneven width, filled with whatever fill is set.
export function rays(ctx: Ctx, id: PackId, W: number, H: number, rand: Rand, focus = FOCUS) {
  const fx = W * focus.x, fy = H * focus.y, far = Math.hypot(W, H) * 0.84
  for (let i = 0; i < 22; i++) {
    const a = (i + rand() * 0.7) / 22 * TAU, w = 0.025 + rand() * 0.065
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a - w) * far, fy + Math.sin(a - w) * far); ctx.lineTo(fx + Math.cos(a + w) * far, fy + Math.sin(a + w) * far); ctx.closePath(); ctx.fill()
  }
}
// `salt` gives a different burst for the same pack (each card has its own).
export const raySeed = (id: PackId, salt = 0) => seeded(id.length * 131 + 17 + salt * 977)

// The burst behind the creature: a hot core, rays, streaks of speed, and sparks.
function burst(ctx: Ctx, id: PackId, W: number, H: number, focus: Focus, salt: number) {
  const u = W / 100, c = PALETTE[id], heat = HEAT[id], fx = W * focus.x, fy = H * focus.y, far = Math.hypot(W, H) * 0.6
  const rand = raySeed(id, salt)
  const base = ctx.createRadialGradient(fx, fy, 0, fx, fy, far)
  base.addColorStop(0, '#fff'); base.addColorStop(0.07, heat.hot); base.addColorStop(0.24, c.p3); base.addColorStop(0.5, c.p2); base.addColorStop(0.9, c.p1)
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const ray = ctx.createRadialGradient(fx, fy, 0, fx, fy, far)
  ray.addColorStop(0, rgba(heat.hot, 0)); ray.addColorStop(0.16, rgba(heat.hot, 0.26)); ray.addColorStop(0.6, rgba(c.p3, 0.14)); ray.addColorStop(1, rgba(c.p3, 0))
  ctx.fillStyle = ray
  rays(ctx, id, W, H, rand, focus)
  // Streaks of speed flying outward.
  ctx.lineCap = 'round'
  for (let i = 0; i < 70; i++) {
    const a = rand() * TAU, r0 = (0.34 + rand() * 0.5) * far, r1 = r0 + (0.06 + rand() * 0.2) * far
    ctx.strokeStyle = rgba(rand() > 0.4 ? heat.spark : c.p3, 0.1 + rand() * 0.3); ctx.lineWidth = (0.15 + rand() * 0.5) * u
    ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0); ctx.lineTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1); ctx.stroke()
  }
  // Ribbons of energy winding around the core.
  for (let i = 0; i < 7; i++) {
    const a = rand() * TAU, r = (0.2 + rand() * 0.42) * far
    ctx.fillStyle = rgba(i % 2 ? heat.hot : c.p3, 0.1 + rand() * 0.14)
    swoosh(ctx, fx, fy, r, a, a + 1 + rand() * 1.3, (1.5 + rand() * 3.5) * u, 0.25)
  }
  ctx.restore()
}

// Dots that shrink away from a corner, like the shading in a printed comic.
function halftone(ctx: Ctx, W: number, H: number, cx: number, cy: number, reach: number, color: string) {
  const step = W * 0.028
  // All the dots go down as one shape, which paints much faster than thousands of fills.
  ctx.beginPath()
  for (let y = step / 2; y < H; y += step) for (let x = (Math.round(y / step) % 2) * step / 2; x < W; x += step) {
    const k = 1 - Math.hypot(x - cx, y - cy) / reach
    if (k <= 0.05) continue
    const r = step * 0.46 * k
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU)
  }
  ctx.fillStyle = color; ctx.fill()
}

function sparks(ctx: Ctx, id: PackId, W: number, H: number, count: number, focus: Focus, salt: number) {
  const u = W / 100, heat = HEAT[id], rand = seeded(id.length * 53 + 5 + salt * 389), fx = W * focus.x, fy = H * focus.y
  ctx.save(); ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < count; i++) {
    const a = rand() * TAU, d = (0.25 + rand() * 0.75) * W * 0.85, x = fx + Math.cos(a) * d * 0.75, y = fy + Math.sin(a) * d * 1.25
    if (i % 3) { ctx.fillStyle = rgba(heat.spark, 0.35 + rand() * 0.5); ctx.beginPath(); ctx.arc(x, y, (0.25 + rand() * 0.6) * u, 0, TAU); ctx.fill() } else sparkle(ctx, x, y, (1.4 + rand() * 2.6) * u, heat.spark)
  }
  ctx.restore()
}

// Everything behind the creature.
export function paintBackdrop(ctx: Ctx, id: PackId, W: number, H: number, focus = FOCUS, salt = 0) {
  const c = PALETTE[id]
  burst(ctx, id, W, H, focus, salt)
  halftone(ctx, W, H, 0, H, W * 0.95, rgba(c.p1, 0.5))
  halftone(ctx, W, H, W, 0, W * 0.8, rgba(c.p1, 0.42))
  // Darker toward the corners, so the middle glows.
  const dark = ctx.createRadialGradient(W * focus.x, H * focus.y, W * 0.45, W * focus.x, H * focus.y, Math.hypot(W, H) * 0.62)
  dark.addColorStop(0, rgba(c.p1, 0)); dark.addColorStop(1, rgba(c.p1, 0.78))
  ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H)
  sparks(ctx, id, W, H, 34, focus, salt)
}

// ---------- A little 3D for the golem: boxes turned in space and drawn flat, far ones first ----------

type V3 = [number, number, number]
type Face = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'
// A box: where its middle is, half its size each way, how it's turned, and what's drawn on its faces
// (in a square from -1 to 1 across the face).
type Box = { at: V3; half: V3; turn?: V3; color: string; on?: Partial<Record<Face, (ctx: Ctx, lit: number) => void>>; glass?: string }
const FACES: { name: Face; n: V3; u: V3; v: V3 }[] = [
  { name: 'front', n: [0, 0, 1], u: [1, 0, 0], v: [0, -1, 0] },
  { name: 'back', n: [0, 0, -1], u: [-1, 0, 0], v: [0, -1, 0] },
  { name: 'right', n: [1, 0, 0], u: [0, 0, -1], v: [0, -1, 0] },
  { name: 'left', n: [-1, 0, 0], u: [0, 0, 1], v: [0, -1, 0] },
  { name: 'top', n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { name: 'bottom', n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
]

function rotate([x, y, z]: V3, [rx, ry, rz]: V3): V3 {
  let c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]
  c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]
  c = Math.cos(rz); s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]
  return [x, y, z]
}

export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), k = Math.max(0, Math.min(1, t))
  const ch = (shift: number) => Math.round(((x >> shift) & 255) + (((y >> shift) & 255) - ((x >> shift) & 255)) * k)
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

const LIGHT: V3 = [-0.42, 0.74, 0.52]

// Draws boxes as seen from `view`, at `scale` screen units per unit, with (0, 0, 0) at (ox, oy).
function drawBoxes(ctx: Ctx, boxes: Box[], view: V3, ox: number, oy: number, scale: number, shadow: string, line: number) {
  const seen = boxes.map(box => ({ box, z: rotate(box.at, view)[2] })).sort((a, b) => a.z - b.z)
  for (const { box } of seen) {
    const turn = box.turn ?? [0, 0, 0], mid = rotate(box.at, view)
    const dir = (v: V3) => rotate(rotate(v, turn), view)
    for (const f of FACES) {
      const n = dir(f.n)
      if (n[2] <= 0.02) continue
      const k = Math.abs(f.n[0]) * box.half[0] + Math.abs(f.n[1]) * box.half[1] + Math.abs(f.n[2]) * box.half[2]
      const ku = Math.abs(f.u[0]) * box.half[0] + Math.abs(f.u[1]) * box.half[1] + Math.abs(f.u[2]) * box.half[2]
      const kv = Math.abs(f.v[0]) * box.half[0] + Math.abs(f.v[1]) * box.half[1] + Math.abs(f.v[2]) * box.half[2]
      const u = dir(f.u), v = dir(f.v)
      const cx = ox + (mid[0] + n[0] * k) * scale, cy = oy - (mid[1] + n[1] * k) * scale
      const ux = u[0] * ku * scale, uy = -u[1] * ku * scale, vx = v[0] * kv * scale, vy = -v[1] * kv * scale
      const lit = 0.36 + 0.82 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
      const face = new Path2D()
      face.moveTo(cx - ux - vx, cy - uy - vy); face.lineTo(cx + ux - vx, cy + uy - vy); face.lineTo(cx + ux + vx, cy + uy + vy); face.lineTo(cx - ux + vx, cy - uy + vy); face.closePath()
      ctx.lineJoin = 'round'
      if (box.glass) {
        // A block made of light: see-through, with bright edges.
        ctx.fillStyle = rgba(box.glass, 0.25 + 0.4 * lit); ctx.fill(face)
        ctx.strokeStyle = rgba(box.glass, 0.5); ctx.lineWidth = line * 3.2; ctx.stroke(face)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = line; ctx.stroke(face)
        continue
      }
      // Each face is a touch lighter toward the light.
      const shade = ctx.createLinearGradient(cx - ux - vx, cy - uy - vy, cx + ux + vx, cy + uy + vy)
      const tone = (l: number) => l < 1 ? mix(shadow, box.color, l) : mix(box.color, '#ffffff', (l - 1) * 1.6)
      shade.addColorStop(0, tone(lit + 0.1)); shade.addColorStop(1, tone(lit - 0.12))
      ctx.fillStyle = shade; ctx.fill(face)
      const draw = box.on?.[f.name]
      if (draw) { ctx.save(); ctx.clip(face); ctx.transform(ux, uy, vx, vy, cx, cy); draw(ctx, lit); ctx.restore() }
      ctx.strokeStyle = shadow; ctx.lineWidth = line; ctx.stroke(face)
    }
  }
}

// ---------- Built: a golem put together out of blocks, building one more ----------

function golem(ctx: Ctx, W: number, H: number) {
  const u = W / 100, ox = W * 0.5, oy = H * 0.475, k = 1.3 * u, rand = seeded(977)
  const steel = '#dbe8f7', navy = '#27467c', dark = '#061433', yellow = '#ffc832', cyan = '#3ff2e2'
  const view: V3 = [0.2, -0.42, 0]
  // Where a point of the golem lands on the pack.
  const at = (p: V3): [number, number] => { const v = rotate(p, view); return [ox + v[0] * k, oy - v[1] * k] }
  const glow = (p: V3, r: number, a: number) => {
    const [x, y] = at(p), g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, rgba('#ffffff', a)); g.addColorStop(0.3, rgba(cyan, a * 0.6)); g.addColorStop(1, rgba(cyan, 0))
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore()
  }
  const zap = (a: V3, b: V3, w = 0.4) => bolt(ctx, ...at(a), ...at(b), rand, w * u, cyan)
  const lamp = (ctx: Ctx, x: number, y: number, r: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, '#aafff6'); g.addColorStop(0.7, cyan); g.addColorStop(1, '#0a8fb8')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
  }
  const hazard = (ctx: Ctx) => {
    ctx.fillStyle = yellow; ctx.fillRect(-1, -1, 2, 2)
    ctx.fillStyle = '#1a1a2a'
    for (let x = -2.4; x < 2; x += 0.8) { ctx.beginPath(); ctx.moveTo(x, 1); ctx.lineTo(x + 0.4, 1); ctx.lineTo(x + 1.4, -1); ctx.lineTo(x + 1, -1); ctx.closePath(); ctx.fill() }
  }
  const panel = (ctx: Ctx) => {
    ctx.strokeStyle = rgba(dark, 0.45); ctx.lineWidth = 0.06
    ctx.strokeRect(-0.78, -0.78, 1.56, 1.56)
    ctx.fillStyle = rgba(dark, 0.55)
    for (const [x, y] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) { ctx.beginPath(); ctx.arc(x, y, 0.07, 0, TAU); ctx.fill() }
  }
  const core = (ctx: Ctx) => {
    panel(ctx)
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, -0.05, 0.62, 0, TAU); ctx.fill()
    lamp(ctx, 0, -0.05, 0.5)
    ctx.strokeStyle = rgba('#ffffff', 0.8); ctx.lineWidth = 0.05; ctx.beginPath(); ctx.arc(0, -0.05, 0.3, 0, TAU); ctx.stroke()
  }
  const visor = (ctx: Ctx) => {
    ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-0.86, -0.46, 1.72, 0.86, 0.2); ctx.fill()
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 0.1, 0); ctx.lineTo(side * 0.72, -0.34); ctx.lineTo(side * 0.74, 0.14); ctx.lineTo(side * 0.16, 0.24); ctx.closePath()
      const g = ctx.createLinearGradient(0, -0.3, 0, 0.2); g.addColorStop(0, '#fff'); g.addColorStop(1, cyan)
      ctx.fillStyle = g; ctx.fill()
    }
    ctx.fillStyle = rgba(dark, 0.6); ctx.fillRect(-0.5, 0.62, 1, 0.08); ctx.fillRect(-0.5, 0.78, 1, 0.08)
  }
  const vents = (ctx: Ctx) => { ctx.fillStyle = rgba(dark, 0.6); for (let y = -0.5; y < 0.6; y += 0.36) ctx.fillRect(-0.6, y, 1.2, 0.16) }
  // A lit strip down a limb.
  const strip = (ctx: Ctx) => { ctx.fillStyle = dark; ctx.fillRect(-0.3, -0.8, 0.6, 1.6); ctx.fillStyle = cyan; ctx.fillRect(-0.14, -0.7, 0.28, 1.4); ctx.fillStyle = '#fff'; ctx.fillRect(-0.05, -0.7, 0.1, 1.4) }
  const knuckles = (ctx: Ctx) => { panel(ctx); ctx.fillStyle = rgba(dark, 0.7); for (const x of [-0.36, 0, 0.36]) ctx.fillRect(x - 0.035, -0.2, 0.07, 0.98) }
  const boxes: Box[] = [
    // Legs.
    { at: [-8, -27, 0], half: [4.2, 6.5, 4.2], turn: [0, 0, -0.1], color: navy, on: { front: strip } },
    { at: [8, -27, 0], half: [4.2, 6.5, 4.2], turn: [0, 0, 0.1], color: navy, on: { front: strip } },
    { at: [-10.5, -40, 1], half: [6, 7.5, 6.5], turn: [0, 0.15, -0.06], color: steel, on: { front: panel } },
    { at: [10.5, -40, 1], half: [6, 7.5, 6.5], turn: [0, -0.15, 0.06], color: steel, on: { front: panel } },
    // Hips and chest.
    { at: [0, -16.5, 0], half: [8, 4, 5.5], color: navy, on: { front: vents } },
    { at: [0, 0, 0], half: [13.5, 12.5, 8.5], turn: [0, 0, 0.03], color: steel, on: { front: core, right: vents, left: vents } },
    // Head with its antenna.
    { at: [-0.5, 19.5, 1.5], half: [8.4, 6.6, 7], turn: [0.08, 0.26, 0.05], color: steel, on: { front: visor } },
    { at: [4.5, 29.5, 0], half: [0.7, 3.4, 0.7], turn: [0, 0, -0.12], color: navy },
    // Shoulders.
    { at: [-20.5, 9.5, 0], half: [6.4, 5.8, 6.8], turn: [0, 0, 0.34], color: yellow, on: { front: hazard, top: hazard } },
    { at: [20.5, 8, 0], half: [6.4, 5.8, 6.8], turn: [0, 0, -0.2], color: yellow, on: { front: hazard, top: hazard } },
    // The arm it holds up, and its hand.
    { at: [-25.5, 17.5, 1], half: [3.4, 6, 3.4], turn: [0, 0, 0.5], color: navy, on: { front: strip } },
    { at: [-28.5, 27.5, 3], half: [5.8, 5.4, 5.8], turn: [0, 0.2, 0.3], color: steel, on: { front: knuckles } },
    // The other arm, fist toward us.
    { at: [26, -3, 3], half: [3.4, 6, 3.4], turn: [0.5, 0, -0.3], color: navy },
    { at: [29.5, -13.5, 11], half: [6.8, 6.8, 6.8], turn: [0.3, -0.3, -0.12], color: steel, on: { front: knuckles } },
  ]
  // Blocks adrift behind it.
  const drift: Box[] = Array.from({ length: 9 }, (_, i) => {
    const a = i / 9 * TAU + 0.5 + rand() * 0.4, d = 36 + rand() * 10, size = 1.5 + rand() * 2.4
    return { at: [Math.cos(a) * d, Math.sin(a) * d * 0.8 - 2, -14], half: [size, size, size], turn: [rand() * 3, rand() * 3, rand() * 3], color: i % 3 ? navy : steel }
  })
  drawBoxes(ctx, drift, view, ox, oy, k, dark, 0.45 * u)

  // The block it's building, lit up over its hand.
  const block: V3 = [-28.5, 39.5, 3], [bx, by] = at(block)
  glow(block, 22 * u, 0.9)
  zap([28, 30, -10], [48, 52, -10], 0.7)
  zap([-22, -6, -10], [-50, 6, -10], 0.7)
  const turn: V3 = [0.5, 0.7, 0.2]
  drawBoxes(ctx, [{ at: [0, 0, 0], half: [5.2, 5.2, 5.2], turn, color: steel, glass: cyan }], [0, 0, 0], bx, by, k, dark, 0.4 * u)

  drawBoxes(ctx, boxes, view, ox, oy, k, dark, 0.55 * u)

  // Light off the antenna, the eyes and the chest, and sparks jumping from it.
  glow([5, 33.5, 0], 8 * u, 1)
  glow([-0.5, 20, 9], 13 * u, 0.4)
  glow([0, 0, 9], 20 * u, 0.5)
  zap([36, -8, 11], [50, 12, 0])
  zap([-15, -20, 6], [-46, -30, 0])
  sparkle(ctx, bx, by, 5 * u)
  sparkle(ctx, ...at([5, 33.5, 0]), 3 * u)
}

// ---------- Blog: a phoenix of ink, its feathers burning at the tips ----------

// One feather from (x, y) pointing along `angle`: dark at the quill, glowing at the tip.
function feather(ctx: Ctx, x: number, y: number, angle: number, len: number, wid: number, colors: string[], line: string, lw: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
  ctx.beginPath(); ctx.moveTo(0, 0)
  ctx.bezierCurveTo(len * 0.2, -wid, len * 0.72, -wid * 0.95, len, 0)
  ctx.bezierCurveTo(len * 0.8, wid * 0.7, len * 0.3, wid * 0.8, 0, 0)
  const g = ctx.createLinearGradient(0, 0, len, 0)
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color))
  ctx.fillStyle = g; ctx.fill()
  ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(len * 0.06, 0); ctx.quadraticCurveTo(len * 0.5, -wid * 0.12, len * 0.9, 0)
  ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = lw * 0.7; ctx.stroke()
  ctx.restore()
}

function phoenix(ctx: Ctx, W: number, H: number) {
  const u = W / 100, rad = Math.PI / 180
  const ink = '#1d1147', ink2 = '#3a1a6e', line = '#12062e', rose = '#e0307a', ember = '#ff8a2e', gold = '#ffd24a', hot = '#fff6c8'
  const fire = [ink, ink2, rose, ember, gold], flame = [rose, ember, gold, hot]
  ctx.save()
  ctx.translate(W * 0.5, H * 0.455); ctx.scale(u, u); ctx.rotate(-5 * rad)
  const lw = 0.5

  // Tail: long plumes trailing down behind it.
  for (const [angle, len, wid] of [[118, 62, 5.5], [62, 62, 5.5], [100, 70, 6], [80, 70, 6], [90, 78, 7]] as const) feather(ctx, 0, 14, angle * rad, len, wid, fire, line, lw)

  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1)
    const wrist: [number, number] = [25, -25]
    // The long feathers at the end of the wing, fanned from the wrist.
    for (let i = 0; i < 9; i++) { const t = i / 8; feather(ctx, wrist[0] - t * 3, wrist[1] + t * 4, (28 - t * 128) * rad, 27 + 17 * Math.sin(Math.PI * (0.25 + t * 0.75)), 5.2, fire, line, lw) }
    // Shorter ones along the arm.
    for (let i = 0; i < 7; i++) { const t = i / 6; feather(ctx, 6 + t * 17, -5 - t * 17, (78 - t * 46) * rad, 16 + t * 14, 4.6, fire, line, lw) }
    // The arm of the wing, under the small feathers that cover it.
    ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(12, -19, 26, -28); ctx.quadraticCurveTo(15, -11, 4, 1); ctx.closePath()
    ctx.fillStyle = ink; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
    for (let i = 0; i < 8; i++) { const t = i / 7; feather(ctx, 4 + t * 21, -7 - t * 20, (70 - t * 150) * rad, 11 + t * 4, 3.4, [ink2, rose, ember], line, lw) }
    for (let i = 0; i < 8; i++) { const t = i / 7; feather(ctx, 2 + t * 22, -5 - t * 22, (60 - t * 150) * rad, 7.5, 2.8, [rose, ember, gold], line, lw) }
    ctx.restore()
  }

  // Body, with rows of chest feathers.
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.bezierCurveTo(9, -8, 10, 10, 0, 22); ctx.bezierCurveTo(-10, 10, -9, -8, 0, -12); ctx.closePath()
  const chest = ctx.createLinearGradient(0, -12, 0, 22); chest.addColorStop(0, ink2); chest.addColorStop(1, ink)
  ctx.fillStyle = chest; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
  for (let row = 0; row < 5; row++) for (let i = -row; i <= row; i += 2) if (Math.abs(i) < 3) feather(ctx, i * 1.5, -9 + row * 4.4, 90 * rad, 6.5, 2.5, [rose, ember, gold], line, lw * 0.8)

  // Neck and head, looking to the side.
  ctx.beginPath(); ctx.moveTo(-4.5, -8); ctx.bezierCurveTo(-5, -17, -2, -22, 0.5, -26); ctx.lineTo(7.5, -22); ctx.bezierCurveTo(4.5, -18, 4.5, -13, 4.5, -8); ctx.closePath()
  ctx.fillStyle = ink2; ctx.fill(); ctx.strokeStyle = line; ctx.stroke()
  // Crest, swept back like flames.
  for (const [angle, len] of [[-172, 13], [-152, 18], [-132, 21], [-112, 17]] as const) feather(ctx, 1, -27.5, angle * rad, len, 2.6, flame, line, lw * 0.8)
  // Head.
  ctx.beginPath(); ctx.moveTo(-2.5, -24); ctx.bezierCurveTo(-3, -31.5, 5, -33, 9, -29.5); ctx.bezierCurveTo(11, -27.5, 10, -23, 7, -21.5); ctx.bezierCurveTo(3, -20, -1.5, -20.5, -2.5, -24); ctx.closePath()
  ctx.fillStyle = ink2; ctx.fill(); ctx.stroke()
  // Beak.
  ctx.beginPath(); ctx.moveTo(8.6, -29.6); ctx.bezierCurveTo(13, -29.5, 17, -27, 18.5, -22.5); ctx.bezierCurveTo(15, -24.5, 12, -24.5, 9, -23.2); ctx.closePath()
  const beak = ctx.createLinearGradient(9, -30, 18, -23); beak.addColorStop(0, hot); beak.addColorStop(1, ember)
  ctx.fillStyle = beak; ctx.fill(); ctx.stroke()
  // Eye, under a hard brow.
  ctx.beginPath(); ctx.moveTo(2.6, -28.6); ctx.lineTo(8, -27.2); ctx.bezierCurveTo(7, -25, 4, -25, 2.6, -28.6); ctx.closePath()
  ctx.fillStyle = hot; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.stroke()

  // Heat coming off it: a glow at the heart and the eye, and embers thrown up from the wings.
  const rand = seeded(2603)
  ctx.globalCompositeOperation = 'lighter'
  for (const [x, y, r, a] of [[0, 2, 15, 0.5], [5, -27, 6, 0.7]]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, rgba(hot, a)); g.addColorStop(0.4, rgba(ember, a * 0.5)); g.addColorStop(1, rgba(ember, 0))
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI * (0.08 + rand() * 0.84), d = 26 + rand() * 34, x = Math.cos(a) * d * 1.05, y = Math.sin(a) * d - 8, r = 0.3 + rand() * 0.8
    // Each ember is a small flame: a drop with its tail blown upward.
    ctx.fillStyle = rgba(i % 3 ? gold : hot, 0.55 + rand() * 0.45)
    ctx.beginPath(); ctx.moveTo(x, y - r * 3.2); ctx.quadraticCurveTo(x + r * 1.3, y, x, y + r); ctx.quadraticCurveTo(x - r * 1.3, y, x, y - r * 3.2); ctx.fill()
  }
  ctx.restore()
}

// ---------- Social: a dragon of the night sky, coiled around a star ----------

function dragon(ctx: Ctx, W: number, H: number) {
  const u = W / 100, rand = seeded(4421)
  const night = '#241468', night2 = '#4a36c0', line = '#110530', cream = '#fff0b8', gold = '#ffc93a', amber = '#f08a1c'
  ctx.save()
  ctx.translate(W * 0.5, H * 0.45); ctx.scale(u, u)
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  const lw = 0.5

  // The star it guards, kept in a ball of night sky, and the others it's joined to.
  const sx = -15, sy = -3, sr = 10.5
  const others: [number, number][] = [[-35, -19], [-40, 5], [-31, 23], [-5, 18], [5, -15], [-17, -27]]
  ctx.save(); ctx.globalCompositeOperation = 'lighter'
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.8, sx, sy, sr * 2.4)
  halo.addColorStop(0, rgba(cream, 0.9)); halo.addColorStop(1, rgba(gold, 0))
  ctx.fillStyle = halo; ctx.fillRect(sx - sr * 2.4, sy - sr * 2.4, sr * 4.8, sr * 4.8)
  ctx.restore()
  ctx.strokeStyle = line; ctx.lineWidth = 0.9
  const web = () => { for (const [x, y] of others) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke() } }
  web(); ctx.strokeStyle = cream; ctx.lineWidth = 0.4; web()
  for (const [x, y] of others) {
    ctx.beginPath(); ctx.arc(x, y, 2.1, 0, TAU); ctx.fillStyle = night2; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.stroke(); ctx.strokeStyle = gold; ctx.lineWidth = 0.6; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 0.7, 0, TAU); ctx.fill()
  }
  const ball = ctx.createRadialGradient(sx - 3, sy - 4, 0, sx, sy, sr)
  ball.addColorStop(0, '#6a50e6'); ball.addColorStop(0.6, night); ball.addColorStop(1, '#120634')
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fillStyle = ball; ctx.fill()
  ctx.strokeStyle = line; ctx.lineWidth = 1.7; ctx.stroke(); ctx.strokeStyle = gold; ctx.lineWidth = 0.8; ctx.stroke()
  for (const [x, y, r] of [[-5.5, 3.5, 0.5], [5, -5, 0.45], [5.5, 4.5, 0.6], [-4, -6, 0.4], [-7, -1.5, 0.35]]) { ctx.fillStyle = cream; ctx.beginPath(); ctx.arc(sx + x, sy + y, r, 0, TAU); ctx.fill() }
  sparkle(ctx, sx, sy, 7.5)
  ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(sx, sy, sr - 1.8, 3.5, 4.6); ctx.stroke()

  // The line its body follows, from the neck down to the tail.
  const pts: [number, number][] = [[19, -23], [31, -11], [27, 8], [3, 13], [-23, 17], [-31, 34], [-12, 47], [20, 49], [46, 60]]
  const spline = (t: number): [number, number] => {
    const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (c2 - a) * k + (2 * a - 5 * b + 4 * c2 - d) * k * k + (3 * b - a - 3 * c2 + d) * k * k * k)
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]
  }
  const N = 140, mid: [number, number][] = [], nrm: [number, number][] = [], wid: number[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N, [x, y] = spline(t), [x2, y2] = spline(Math.min(1, t + 0.004)), [x1, y1] = spline(Math.max(0, t - 0.004))
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1
    mid.push([x, y]); nrm.push([-dy / d, dx / d]); wid.push((6.2 + 1.8 * Math.sin(Math.PI * Math.min(1, t * 1.5))) * (1 - t ** 3 * 0.8))
  }
  const edge = (i: number, k: number): [number, number] => { const j = Math.min(N, i); return [mid[j][0] + nrm[j][0] * wid[j] * k, mid[j][1] + nrm[j][1] * wid[j] * k] }
  const band = (from: number, to: number) => { ctx.beginPath(); for (let i = 0; i <= N; i++) ctx.lineTo(...edge(i, from)); for (let i = N; i >= 0; i--) ctx.lineTo(...edge(i, to)); ctx.closePath() }

  // Fins down its back, swept toward the tail like fire.
  for (let i = N - 42; i >= 8; i -= 6) {
    const [bx, by] = edge(i, -0.9), [ex, ey] = edge(i + 7, -0.9), h = wid[i] * (1.15 + 0.45 * Math.sin(i * 1.7)), n = nrm[i]
    const tx = ex - n[0] * h + (ex - bx) * 0.5, ty = ey - n[1] * h + (ey - by) * 0.5
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - n[0] * h * 0.9, by - n[1] * h * 0.9, tx, ty); ctx.quadraticCurveTo(ex - n[0] * h * 0.25, ey - n[1] * h * 0.25, ex, ey); ctx.closePath()
    const g = ctx.createLinearGradient(bx, by, tx, ty); g.addColorStop(0, amber); g.addColorStop(0.6, gold); g.addColorStop(1, cream)
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
  }
  // Body: night-blue back, pale belly in plates.
  band(-1, 1); ctx.fillStyle = night; ctx.fill()
  band(-1, -0.35); ctx.fillStyle = night2; ctx.fill()
  band(0.2, 1); ctx.fillStyle = cream; ctx.fill()
  band(0.68, 1); ctx.fillStyle = gold; ctx.fill()
  ctx.strokeStyle = amber; ctx.lineWidth = lw * 0.8
  for (let i = 3; i < N; i += 3) { ctx.beginPath(); ctx.moveTo(...edge(i, 0.2)); ctx.lineTo(...edge(i + 1, 1)); ctx.stroke() }
  ctx.beginPath(); for (let i = 0; i <= N; i++) ctx.lineTo(...edge(i, 0.2)); ctx.strokeStyle = line; ctx.lineWidth = lw * 0.8; ctx.stroke()
  band(-1, 1); ctx.strokeStyle = line; ctx.lineWidth = lw * 1.3; ctx.stroke()
  // Stars along its back, joined up like a constellation.
  const stars: [number, number][] = []
  for (let i = 8; i < N - 10; i += 8) stars.push(edge(i, -0.3 - rand() * 0.45))
  ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = 0.25; ctx.beginPath(); stars.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke()
  for (const [x, y] of stars) sparkle(ctx, x, y, 1.3 + rand() * 1.1)

  // Head, drawn facing right, then flipped to look back at the star.
  ctx.save()
  ctx.translate(19, -25.5); ctx.scale(-1.2, 1.2); ctx.rotate(0.3)
  const horn = (x: number, y: number, len: number, lift: number, thick: number) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - len * 0.6, y - lift * 0.15, x - len, y - lift); ctx.quadraticCurveTo(x - len * 0.5, y + thick - lift * 0.05, x + 1, y + thick); ctx.closePath()
    const g = ctx.createLinearGradient(x, y, x - len, y - lift); g.addColorStop(0, amber); g.addColorStop(0.5, gold); g.addColorStop(1, cream)
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
  }
  // Frills behind the jaw, and the horns.
  for (const [a, len] of [[2.3, 9], [2.7, 12], [3.1, 13], [3.5, 10]] as const) feather(ctx, -1, 2, a, len, 2.6, [amber, gold, cream], line, lw)
  horn(-2, -6, 19, 9, 4.6); horn(1.5, -8.6, 15, 12, 4.2)
  // Lower jaw, a little open.
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(8.5, 1.4); ctx.bezierCurveTo(13, 2.6, 17, 2.8, 20.5, 2.2); ctx.bezierCurveTo(21.4, 3.6, 20, 5.2, 17.5, 5.6); ctx.bezierCurveTo(12, 7, 5, 8.4, -1, 7.4); ctx.bezierCurveTo(-4.5, 6.6, -5, 3.4, -2, 2); ctx.closePath()
  ctx.fillStyle = cream; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke()
  // Inside the mouth.
  ctx.beginPath(); ctx.moveTo(8.5, 1.2); ctx.lineTo(21.5, -0.6); ctx.lineTo(20.5, 2.4); ctx.bezierCurveTo(17, 3, 13, 2.8, 8.5, 1.2); ctx.closePath()
  ctx.fillStyle = '#7a1848'; ctx.fill(); ctx.stroke()
  // Skull and snout.
  ctx.beginPath(); ctx.moveTo(-2, 2.4); ctx.bezierCurveTo(-7, 1, -6.5, -6.4, -1.5, -7.4); ctx.bezierCurveTo(3, -9.4, 8, -9.2, 11, -7); ctx.bezierCurveTo(14, -6.4, 18, -6, 21.5, -5.2); ctx.bezierCurveTo(24.6, -4.6, 25.2, -1.6, 23, -0.6)
  ctx.lineTo(21.8, 1.6); ctx.lineTo(20.4, -0.4); ctx.lineTo(18.6, -0.1); ctx.lineTo(17.6, 1.5); ctx.lineTo(16.4, 0.2); ctx.bezierCurveTo(13, 0.8, 10.5, 1.2, 8.5, 1.2); ctx.bezierCurveTo(5, 3.4, 1.5, 3.2, -2, 2.4); ctx.closePath()
  const skull = ctx.createLinearGradient(0, -9, 0, 3); skull.addColorStop(0, night2); skull.addColorStop(0.7, night)
  ctx.fillStyle = skull; ctx.fill(); ctx.lineWidth = lw * 1.2; ctx.stroke()
  // Eye under a heavy brow, and the nostril.
  ctx.beginPath(); ctx.moveTo(7.6, -6.2); ctx.lineTo(14, -4.2); ctx.bezierCurveTo(12.6, -1.8, 9, -2.2, 7.6, -6.2); ctx.closePath()
  ctx.fillStyle = '#fffbe6'; ctx.fill(); ctx.lineWidth = lw; ctx.stroke()
  ctx.fillStyle = line; ctx.beginPath(); ctx.ellipse(10.8, -4.2, 0.55, 1.3, 0.35, 0, TAU); ctx.fill()
  ctx.beginPath(); ctx.ellipse(22.4, -3.2, 0.8, 0.4, 0.4, 0, TAU); ctx.fill()
  // Whiskers.
  for (const [w, path] of [[0.75, [23.6, -1.6, 34, -6, 36, 6, 28, 13]], [0.6, [22.6, -0.4, 29, 5, 24, 13, 16, 15]]] as const) {
    ctx.beginPath(); ctx.moveTo(path[0], path[1]); ctx.bezierCurveTo(path[2], path[3], path[4], path[5], path[6], path[7])
    ctx.strokeStyle = line; ctx.lineWidth = w + 0.7; ctx.stroke(); ctx.strokeStyle = gold; ctx.lineWidth = w; ctx.stroke()
  }
  ctx.restore()
  ctx.restore()
}

// The creature on the pack.
export function paintHero(ctx: Ctx, id: PackId, W: number, H: number) {
  if (id === 'works') golem(ctx, W, H)
  else if (id === 'blog') phoenix(ctx, W, H)
  else dragon(ctx, W, H)
}
