// The card packs as a Three.js scene: foil packs you can spin and tear, and solid cards that
// slide out of them into a stack you swipe through. World units are CSS pixels on the z = 0
// plane, so a rect from geometry.ts lands on exactly the same spot on screen.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CARD_RATIO, PACK_RATIO, packRect, packSpacing, stackRect, zoomRect } from './geometry.ts'
import { paintCardBack, paintCardFoil, paintCardFront, paintPackBack, paintPackFin, paintPackFront, paintPackMask, paintPackSheen, loadImage } from './paint.ts'
import { PALETTE } from './palette.ts'
import { EDGE, FIN, RIP_Y, finLift, pillow, smooth, teeth } from './shapes.ts'
import { tilt as deviceTilt } from './motion.ts'
import { FoilStrip } from './strip.ts'
import type { PackData } from './types.ts'

export type Stage = 'shelf' | 'tear' | 'opening' | 'stack' | 'closing'
// `zoom`: the picked pack is up close, ready to tear (it stays up close while it opens).
export type StageState = { stage: Stage; active: number; index: number; face: 'front' | 'back'; tearing: boolean; ready: boolean; zoom: boolean }

const FOV = 30
// How much bigger the picked pack is drawn while you tear it.
export const PICKED_SCALE = 1.06
// The pack's puff at its thickest, as a share of its width. A real one is about 4 mm on 66 mm.
const PUFF = 0.09
// A card's thickness as a share of its width: thicker than real card stock so it reads as solid.
const CARD_DEPTH = 0.014
// How much of the width the cut has to cover before the strip comes off. Reaching the far edge
// also finishes it, so a cut started in the middle still works.
const TEAR_DISTANCE = 0.88
// The opening ends as the last card lands on the stack; closing plays it backwards, then seals.
export const OPEN_MS = 1720, CLOSE_MS = OPEN_MS + 400
const FAN = [0, -1.6, 1.3, -0.9]
// Putting the laid-out cards back: each flies from its spot into the deck, the last card first,
// after a beat in which the pictures on the page dissolve into the 3D cards under them.
const GATHER_HOLD = 50, GATHER_FLY = 560, GATHER_STAGGER = 70
const DEG = Math.PI / 180

type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; o: number }
const pose = (p: Partial<Pose> = {}): Pose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, ...p })
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t * t
function mix(a: Pose, b: Pose, t: number): Pose {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t), s: lerp(a.s, b.s, t), o: lerp(a.o, b.o, t) }
}
// Moves a pose toward a target, framerate independent.
function damp(a: Pose, b: Pose, dt: number, speed = 9) { return mix(a, b, 1 - Math.exp(-speed * dt)) }
function apply(obj: THREE.Object3D, p: Pose) {
  obj.position.set(p.x, p.y, p.z); obj.rotation.set(p.rx, p.ry, p.rz); obj.scale.setScalar(p.s)
}

// Waits for a quiet moment, so slow painting runs between frames instead of freezing an animation.
const idle = () => new Promise<void>(resolve => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 250 })
  else setTimeout(resolve, 16)
})

function canvas(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return c
}
// `upload: false` for a canvas that's painted later: it's sent to the GPU when it's marked changed.
function texture(c: HTMLCanvasElement, color = true, upload = true) {
  const t = upload ? new THREE.CanvasTexture(c) : new THREE.Texture(c)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// The wrapper: a closed foil pillow. Front and back meet at the folded long sides and are
// sealed flat at the crimped ends, with a fin seal folded over down the back.
// Materials: 0 front, 1 back, 2 inside of the front (and the fin's bare underside), 3 inside of the
// back, 4 the print on the fin (its own little texture, see paintPackFin).
export function pillowGeometry(w: number, h: number, depth: number, segX = 28, segY = 56) {
  const g = new THREE.BufferGeometry()
  const pos: number[] = [], uv: number[] = [], shade: number[] = [], index: number[][] = [[], [], [], [], []]
  const edge = w * EDGE
  const vert = (x: number, y: number, z: number, u: number, v: number, light = 1) => { pos.push(x, y, z); uv.push(u, v); shade.push(light, light, light); return pos.length / 3 - 1 }
  const grid = (side: 1 | -1, shaded = false) => {
    const base = pos.length / 3
    for (let j = 0; j <= segY; j++) for (let i = 0; i <= segX; i++) {
      const fx = i / segX, fy = j / segY, u = side === 1 ? fx : 1 - fx
      // The back is in shadow under the fin, and just past its free edge (the grid's next column out).
      const under = shaded && u > FIN.x + 0.01 && u < FIN.x + FIN.w ? finLift((fy - FIN.top) / (FIN.bottom - FIN.top)) : 0
      // Never thinner than two sheets pressed together, at the crimped ends and the folds.
      vert((fx - 0.5) * w, (0.5 - fy) * h, side * (depth / 2 * pillow(fx, fy) + edge), u, 1 - fy, 1 - 0.62 * under)
    }
    return base
  }
  const faces = (base: number, flip: boolean, material: number) => {
    for (let j = 0; j < segY; j++) for (let i = 0; i < segX; i++) {
      const a = base + j * (segX + 1) + i, b = a + 1, c = a + segX + 1, d = c + 1
      if (flip) index[material].push(a, b, c, b, d, c); else index[material].push(a, c, b, b, c, d)
    }
  }
  // The insides get their own vertices so their normals point inward instead of cancelling out.
  faces(grid(1), false, 0); faces(grid(-1, true), true, 1); faces(grid(1), true, 2); faces(grid(-1), false, 3)

  // The edges. `near` and `far` are two rows of points running clockwise around the outline (as
  // seen from the front), `near` the one closer to the front: the band between them faces outward.
  const band = (near: number[], far: number[], material: number) => {
    for (let i = 0; i < near.length - 1; i++) index[material].push(near[i], near[i + 1], far[i], near[i + 1], far[i + 1], far[i])
  }
  // The cut ends follow the serrated teeth and show the crimp's bare foil. Their texture spot
  // sits a little inside the outline, so the mask that cuts the teeth doesn't cut the edge away.
  const inset = (fx: number) => clamp(fx, 0.02, 0.98)
  for (const [points, fy] of [[teeth(0, 1), 0.03], [teeth(1, -1).reverse(), 0.97]] as const) {
    const row = (z: number) => points.map(([x, y]) => vert((x - 0.5) * w, (0.5 - y) * h, z, inset(x), 1 - fy))
    band(row(edge), row(-edge), 0)
  }
  // The long sides are folds, so they're rounded off and the print runs around them: the front's
  // print on the front half, the back's on the back half.
  for (const fx of [1, 0]) {
    const x = (fx - 0.5) * w, out = (fx - 0.5) * edge, ends = fx ? [0, 1] : [1, 0]
    const row = (dx: number, z: number, u: number) => ends.map(fy => vert(x + dx, (0.5 - fy) * h, z, u, 1 - fy))
    const u = clamp(fx, 0.004, 0.996)
    band(row(0, edge, u), row(out, 0, u), 0)
    band(row(out, 0, 1 - u), row(0, -edge, 1 - u), 1)
  }

  // The fin seal: a flap of doubled foil hinged down the middle of the back, lying over to one side
  // with its free edge a little off the pack. It hugs the pack's curve and flattens into it at both ends.
  const S = 5, T = 40, sheet = w * 0.005
  // A point on the fin, `k` of the way from its hinge to its free edge and `along` of the way down
  // it, on its printed top (`skin` 1) or its bare underside (0).
  const finPoint = (k: number, along: number, skin: number, own = false) => {
    const u = FIN.x + FIN.w * k, fx = 1 - u, fy = lerp(FIN.top, FIN.bottom, along)
    // The top never quite touches the pack, so the two don't flicker where the fin lies flat.
    const seal = 0.3 + 0.7 * smooth(0, 0.3, k) * smooth(0, 0.03, along) * smooth(0, 0.03, 1 - along)
    const off = FIN.lift * w * k ** 1.5 * finLift(along) + skin * sheet * seal
    // The printed top is mapped onto the fin's own texture (`own`), the bare parts onto the pack's,
    // for its outline mask.
    return vert((fx - 0.5) * w, (0.5 - fy) * h, -(depth / 2 * pillow(fx, fy) + edge) - off, own ? k : u, own ? 1 - along : 1 - fy)
  }
  const finGrid = (skin: number) => {
    const base = pos.length / 3
    for (let t = 0; t <= T; t++) for (let s = 0; s <= S; s++) finPoint(s / S, t / T, skin, skin === 1)
    return base
  }
  const top = finGrid(1), under = finGrid(0)
  for (let t = 0; t < T; t++) for (let s = 0; s < S; s++) {
    const at = (base: number) => { const a = base + t * (S + 1) + s; return [a, a + 1, a + S + 1, a + S + 2] }
    const [a, b, c, d] = at(top), [e, f, m, n] = at(under)
    index[4].push(a, c, b, b, c, d)
    index[2].push(e, f, m, f, n, m)
  }
  // The fin's cut edge, bare foil: from the height of its top down to its underside.
  const free = (skin: number) => Array.from({ length: T + 1 }, (_, t) => finPoint(1, t / T, skin))
  band(free(1), free(0), 2)

  g.setIndex(index.flat())
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  // Only the back's material reads this (vertexColors).
  g.setAttribute('color', new THREE.Float32BufferAttribute(shade, 3))
  let start = 0
  index.forEach((list, i) => { g.addGroup(start, list.length, i); start += list.length })
  g.computeVertexNormals()
  return g
}

// The band along the tear line where the cut glows, lying on the pack's front, as a share of its height.
const CUT_BAND = 0.11
function cutGeometry(w: number, h: number, depth: number, seg = 28) {
  const g = new THREE.BufferGeometry(), pos: number[] = [], uv: number[] = [], index: number[] = []
  const y = (0.5 - RIP_Y) * h, band = h * CUT_BAND
  for (let i = 0; i <= seg; i++) {
    const fx = i / seg, z = depth / 2 * pillow(fx, RIP_Y) + w * EDGE + 0.6
    pos.push((fx - 0.5) * w, y - band / 2, z, (fx - 0.5) * w, y + band / 2, z)
    uv.push(fx, 0, fx, 1)
    if (i < seg) { const a = i * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  }
  g.setIndex(index)
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

// The light of the cut: a hot line from where the finger started to where it is now, brightest
// at the finger, and a faint pulse along the whole seam before the first swipe.
function cutMaterial(glow: [number, number, number]) {
  return new THREE.ShaderMaterial({
    uniforms: { uFrom: { value: 0 }, uTo: { value: 0 }, uCut: { value: 0 }, uSeam: { value: 0 }, uFlash: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 12 }, uColor: { value: new THREE.Color(...glow.map(v => v / 255) as [number, number, number]) } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uFrom, uTo, uCut, uSeam, uFlash, uTime, uAspect; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float d = (vUv.y - 0.5) * 2.0;
        float core = exp(-d * d * 70.0), halo = exp(-d * d * 4.0);
        float lo = min(uFrom, uTo), hi = max(uFrom, uTo);
        float inCut = smoothstep(lo - 0.004, lo + 0.004, vUv.x) * (1.0 - smoothstep(hi - 0.004, hi + 0.004, vUv.x));
        float along = clamp((vUv.x - uFrom) / max(0.0001, uTo - uFrom), 0.0, 1.0);
        float dx = (vUv.x - uTo) * uAspect;
        float head = exp(-(dx * dx + d * d) * 4.0);
        float cut = uCut * (inCut * (0.45 + 0.55 * along * along) * (core * 2.4 + halo * 0.9) + head * 2.4);
        // Before the first swipe a flash runs along the seam, left to right, every couple of seconds.
        float phase = mod(uTime, 2.4) / 1.1;
        float sx = mix(-0.15, 1.15, smoothstep(0.0, 1.0, phase)) ;
        float sdx = (vUv.x - sx) * uAspect;
        float sweep = phase < 1.0 ? exp(-(sdx * sdx * 0.35 + d * d * 5.0)) : 0.0;
        float seam = uSeam * ((0.3 + 0.15 * sin(uTime * 3.5)) * (core + halo * 0.25) + sweep * (1.4 + core * 1.6));
        float flash = uFlash * (core * 2.0 + halo * 0.8);
        // Fade to nothing before the band's edges and ends so it never shows as a rectangle.
        float edge = (1.0 - smoothstep(0.5, 1.0, abs(d))) * smoothstep(0.0, 0.04, vUv.x) * (1.0 - smoothstep(0.96, 1.0, vUv.x));
        float a = (cut + seam + flash) * edge;
        vec3 col = mix(uColor, vec3(1.0), clamp(core * 0.9 + head * 0.8 + uSeam * sweep * 0.7, 0.0, 1.0));
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  })
}

// A card: a thin slab with rounded corners. Groups: 0 front, 1 edges, 2 back.
export function cardGeometry(w: number, h: number, depth: number) {
  const r = w * 0.045, shape = new THREE.Shape()
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  shape.lineTo(-w / 2 + r, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 })
  g.translate(0, 0, -depth / 2)
  // ExtrudeGeometry puts both lids in group 0, the bottom (back) half first.
  const [lids, sides] = g.groups
  const half = lids.count / 2
  g.clearGroups()
  g.addGroup(lids.start + half, half, 0); g.addGroup(sides.start, sides.count, 1); g.addGroup(lids.start, half, 2)
  const p = g.getAttribute('position'), uv = g.getAttribute('uv')
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) + w / 2) / w, v = (p.getY(i) + h / 2) / h
    uv.setXY(i, i >= lids.start && i < lids.start + half ? 1 - u : u, v)
  }
  return g
}

type PackObj = {
  root: THREE.Group; spin: THREE.Group; whole: THREE.Mesh; body: THREE.Mesh; flap: THREE.Mesh
  mats: THREE.MeshPhysicalMaterial[]; current: Pose; spinAngle: number; spinTarget: number; spinVel: number
  // How much this pack leans with the pointer or the phone right now (0 to 1).
  lean: number
  cut: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; strip: FoilStrip
}
// `flat`: how much the card shows as its plain picture instead of a lit, shiny thing (see shade).
// `away`: how much of the way from its picture on the page to the stack it still has to go.
type CardObj = { mesh: THREE.Mesh; current: Pose; front: THREE.MeshPhysicalMaterial; image: string; flat: number; away: number }
// A card flying in from its picture keeps looking like it for the first part of the way, and
// takes on the light over the rest: up by the pictures it would catch a glare and wash out.
const flatFor = (away: number) => { const x = clamp(away / 0.6); return x * x * (3 - 2 * x) }
export type StageOptions = { active: number; intro: boolean }

export class CardStage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(FOV, 1, 1, 20000)
  private packs: PackObj[] = []
  private cards = new Map<string, CardObj[]>()
  private burst: THREE.Sprite
  private seal: THREE.Sprite
  private raycaster = new THREE.Raycaster()
  private frame = 0
  private last = performance.now()
  private vw = 1
  private vh = 1
  private state: StageState = { stage: 'shelf', active: 1, index: 0, face: 'front', tearing: false, ready: false, zoom: false }
  private stageStart = 0
  // Where the cards start when they're gathered back up from the recap grid, and how long it takes.
  private gather: Pose[] | null = null
  private gatherMs = 0
  // When the cards last set off from the recap grid toward the stack (they start gently).
  private showAt = -1e9
  // Scene time in ms. It advances by at most 50 ms a frame, so a slow frame or a busy tab
  // slows the animations down instead of skipping them.
  private clock = 0
  // ?slowmo=10 plays every animation ten times slower, for checking them frame by frame.
  private timeScale = 1
  private tear: { start: number; min: number; max: number; at: number; fromLeft: boolean; ticks: number } | null = null
  private gesture: { id: number; x: number; y: number; t: number; mode: 'swipe' | 'spin' | 'tear' | 'card' | null; lastX: number; lastT: number; v: number; base: number; target: 'pack' | 'body' | 'none' } | null = null
  private drag = { dx: 0, active: false }
  private pointer: { x: number; y: number; t: number } | null = null
  private tilt = { x: 0, y: 0 }
  // The cards live in a deck that turns about the stack's center, so the stack leans as one
  // piece and the cards never cut through each other.
  private deckPivot = new THREE.Group()
  private deck = new THREE.Group()
  private deckLean = { x: 0, y: 0 }
  private reduced: boolean
  private disposed = false
  private pendingPick = false
  // Set from the moment the strip comes off until the cards start coming out (they may still be
  // painting). Nothing else can be started in between.
  private pendingOpen = false
  // Called once the picked pack is back in its place on the shelf, on the way to the homepage,
  // or at this scene time if it somehow isn't by then.
  private onSettled: (() => void) | null = null
  private settleBy = 0
  // Painting is held off until this scene time, while things are moving (see quiet).
  private busyUntil = 0
  private backPainted: boolean[] = []
  private compiled = false
  // Set when the page arrived through the homepage morph: the side packs slide in once it's drawn.
  private intro = false
  // Set while leaving for the homepage: the side packs slide away and the pick pack holds still.
  private exiting = false
  private cardJobs = new Map<string, Promise<CardObj[]>>()
  private fronts: HTMLCanvasElement[] = []
  // Sizes the meshes were built at; a resize scales them instead of rebuilding.
  private builtPackW = 0
  private builtCardW = 0
  private get packScale() { return this.builtPackW ? packRect(this.vw, this.vh).w / this.builtPackW : 1 }
  private get cardScale() { return this.builtCardW ? stackRect(this.vw, this.vh).w / this.builtCardW : 1 }

  constructor(private canvasEl: HTMLCanvasElement, private data: PackData[], private onChange: (state: StageState) => void, { active, intro }: StageOptions) {
    this.intro = intro
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const params = new URLSearchParams(window.location.search)
    this.timeScale = 1 / Math.max(1, Number(params.get('slowmo')) || 1)
    // With ?slowmo the scene is also reachable from the console and from test scripts, to read its clock.
    if (params.has('slowmo')) (window as unknown as { cardStage?: CardStage }).cardStage = this
    this.state.active = active
    this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.05
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    // A small environment map is plenty for the soft reflections and is quick to make.
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03, 0.1, 100, { size: 128 }).texture
    this.scene.environmentIntensity = 0.45
    pmrem.dispose()
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-0.5, 0.8, 1)
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    // Lights shine in both render passes (see loop).
    key.layers.enableAll(); ambient.layers.enableAll()
    this.scene.add(key, ambient)
    this.deckPivot.add(this.deck); this.scene.add(this.deckPivot)
    this.renderer.autoClear = false

    this.burst = this.glowSprite(); this.seal = this.glowSprite(true)
    this.resize(window.innerWidth, window.innerHeight)
    this.build()
    // Compile the shaders before the first frame, without blocking where the browser can do it
    // in the background, so the hand-off from the homepage doesn't stall on it.
    // The torn parts, the cut light and the glows are hidden until a tear, but compile them now too.
    const hidden: THREE.Object3D[] = [...this.packs.flatMap(p => [p.body, p.flap, p.cut]), this.burst, this.seal]
    hidden.forEach(m => { m.visible = true })
    void this.renderer.compileAsync(this.scene, this.camera).then(() => {
      hidden.forEach(m => { m.visible = false })
      this.compiled = true
    })
    canvasEl.addEventListener('pointerdown', this.down)
    canvasEl.addEventListener('pointermove', this.move)
    canvasEl.addEventListener('pointerup', this.up)
    canvasEl.addEventListener('pointercancel', this.cancel)
    canvasEl.addEventListener('pointerleave', this.leave)
    this.frame = requestAnimationFrame(this.loop)
  }

  // ---------- Building ----------

  private glowSprite(line = false) {
    const c = canvas(256, line ? 32 : 256), ctx = c.getContext('2d')!
    const g = line ? ctx.createLinearGradient(0, 0, 256, 0) : ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    if (line) { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.15, '#fff'); g.addColorStop(0.85, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)') } else {
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,250,230,.8)'); g.addColorStop(0.45, 'rgba(255,240,200,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, line ? 32 : 256)
    if (line) { ctx.globalCompositeOperation = 'destination-in'; const v = ctx.createLinearGradient(0, 0, 0, 32); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.5, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = v; ctx.fillRect(0, 0, 256, 32) }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
    s.visible = false; s.renderOrder = 10
    this.scene.add(s)
    return s
  }

  private build() {
    const { w, h } = packRect(this.vw, this.vh)
    this.builtPackW = w
    // Painted big enough to stay sharp up close, at the resolution the scene is drawn at.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const tw = Math.min(1024, Math.round(Math.max(w * PICKED_SCALE, zoomRect(this.vw, this.vh).w) * dpr)), th = tw / PACK_RATIO
    const geo = pillowGeometry(w, h, w * PUFF), cutGeo = cutGeometry(w, h, w * PUFF)
    const masks = (['whole', 'flap', 'body'] as const).map(part => { const c = canvas(512, 512 / PACK_RATIO); paintPackMask(c, part); return texture(c, false) })
    // Sent to the GPU now rather than on the first frame of a tear.
    masks.forEach(mask => this.renderer.initTexture(mask))
    this.data.forEach((data, i) => {
      // The back only shows once a pack is picked and spun, so it's painted later (paintBacks).
      const front = canvas(tw, th), back = canvas(tw, th), fin = canvas(tw * FIN.w, th * (FIN.bottom - FIN.top))
      paintPackFront(front, { id: data.id, count: data.cards.length })
      this.fronts[i] = front
      const frontTex = texture(front), backTex = texture(back, true, false), finTex = texture(fin, true, false)
      // How the front catches the light: the burst is mirror foil, the creature and the small print are ink.
      const sheen = canvas(tw / 2, th / 2)
      paintPackSheen(sheen, data.id)
      const sheenTex = texture(sheen, false)
      // `shaded`: darkened by the geometry's vertex colors (the shadow under the back's fin). The
      // fin has no outline mask: it lies well inside the pack's.
      const foil = (map: THREE.Texture, alphaMap?: THREE.Texture, shine?: THREE.Texture, shaded = false) => new THREE.MeshPhysicalMaterial({
        map, transparent: true, clearcoat: 0.35, clearcoatRoughness: 0.3, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 750], vertexColors: shaded,
        ...(alphaMap ? { alphaMap, alphaTest: 0.5 } : {}),
        ...(shine ? { metalness: 1, roughness: 1, iridescence: 1, metalnessMap: shine, roughnessMap: shine, iridescenceMap: shine } : { metalness: 0.2, roughness: 0.45, iridescence: 0.4 }),
      })
      const inside = (alphaMap: THREE.Texture) => new THREE.MeshPhysicalMaterial({ color: 0xc8cdd8, alphaMap, alphaTest: 0.5, transparent: true, metalness: 0.9, roughness: 0.35 })
      const make = (alpha: THREE.Texture) => {
        const mats = [foil(frontTex, alpha, sheenTex), foil(backTex, alpha, undefined, true), inside(alpha), inside(alpha), foil(finTex)]
        return new THREE.Mesh(geo, mats)
      }
      const whole = make(masks[0]), body = make(masks[2])
      // The strip you tear off is its own soft piece of foil (strip.ts).
      const strip = new FoilStrip(w, h, w * PUFF, w * EDGE)
      const flap = new THREE.Mesh(strip.geometry, [foil(frontTex, masks[1], sheenTex), foil(backTex, masks[1])])
      const cut = new THREE.Mesh(cutGeo, cutMaterial(PALETTE[data.id].glow))
      // Makes the bright head at the finger round: the band is this many times longer than half its height.
      cut.material.uniforms.uAspect.value = 2 * PACK_RATIO / CUT_BAND
      cut.renderOrder = 10; cut.visible = false
      const root = new THREE.Group(), spin = new THREE.Group()
      body.visible = flap.visible = false
      spin.add(whole, body, flap, cut); root.add(spin)
      this.scene.add(root)
      const mats = [whole, body, flap].flatMap(m => m.material as THREE.MeshPhysicalMaterial[])
      const obj: PackObj = { root, spin, whole, body, flap, mats, current: pose(), spinAngle: 0, spinTarget: 0, spinVel: 0, lean: 0, cut, strip }
      obj.current = this.packTarget(i, 0)
      // After the homepage morph only the middle pack is showing; the others come in from the sides.
      if (this.intro && !this.reduced && i !== this.state.active) obj.current = { ...obj.current, x: obj.current.x + Math.sign(i - this.state.active) * packSpacing(this.vw, w) * 0.7, o: 0 }
      apply(root, obj.current)
      this.packs.push(obj)
    })
  }

  // The scene is on screen: the homepage's painted pack can go, and the rest is painted between
  // frames, pack backs first, then the cards of the pack in front.
  private async onFirstFrame() {
    // Nothing is painted while the scene comes in: the light blooms, the words rise, the packs slide in.
    this.busyUntil = this.clock + (this.intro ? 900 : 500)
    this.state.ready = true; this.emit()
    if (this.pendingPick) { this.pendingPick = false; this.pick() }
    await this.paintBacks()
    void this.prepareCards(this.state.active)
  }

  // Painting takes long enough to drop a frame or two, so it waits for a moment when nothing is
  // moving: every change of stage, pack or zoom holds it off for a while (see set).
  private async quiet() {
    // A torn pack waiting for its cards doesn't wait for anything.
    while (this.clock < this.busyUntil && !this.pendingOpen && !this.disposed) await new Promise(resolve => setTimeout(resolve, 50))
    if (this.pendingOpen) await new Promise(resolve => setTimeout(resolve, 0)); else await idle()
  }

  private paintBack(i: number) {
    if (this.backPainted[i] || !this.packs[i]) return
    this.backPainted[i] = true
    const data = this.data[i], mats = this.packs[i].whole.material as THREE.MeshPhysicalMaterial[], tex = mats[1].map!, fin = mats[4].map!
    paintPackBack(tex.image as HTMLCanvasElement, { id: data.id, names: data.cards.map(c => c.name) })
    paintPackFin(fin.image as HTMLCanvasElement, tex.image as HTMLCanvasElement)
    tex.needsUpdate = fin.needsUpdate = true
  }

  // The pack in front first: it's the one that can be turned around.
  private async paintBacks() {
    const order = [...this.packs.keys()].sort((a, b) => Math.abs(a - this.state.active) - Math.abs(b - this.state.active))
    for (const i of order) {
      await this.quiet()
      if (this.disposed) return
      this.paintBack(i)
    }
  }

  // The front art of pack i, as painted for its texture (the homepage morph reuses it on the way back).
  packFront(i: number) { return this.fronts[i] ?? null }

  // Before going back to the homepage: the side packs slide away and the picked one goes back to
  // its place on the shelf, where the homepage grows out of it. Resolves once it's there.
  exit() {
    this.exiting = true
    this.gesture = null
    if (this.tear) { this.tear = null; this.set({ tearing: false }) }
    const p = this.packs[this.state.active]
    if (p) p.spinTarget = Math.round(p.spinAngle / (Math.PI * 2)) * Math.PI * 2
    if (this.state.stage === 'tear' && !this.pendingOpen) p?.strip.settle()
    this.settleBy = this.clock + 700
    return new Promise<void>(resolve => {
      // (The timer is for a tab that stopped drawing.)
      const timer = setTimeout(resolve, 3000)
      this.onSettled = () => { clearTimeout(timer); resolve() }
    })
  }

  // Paints pack i's cards one at a time between frames. Opening the pack waits for this.
  private prepareCards(i: number) {
    const id = this.data[i].id
    let job = this.cardJobs.get(id)
    if (!job) { job = this.paintCards(i); this.cardJobs.set(id, job) }
    return job
  }

  private async paintCards(i: number) {
    const data = this.data[i]
    const list: CardObj[] = []
    const s = stackRect(this.vw, this.vh), dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    if (!this.builtCardW) this.builtCardW = s.w
    const tw = Math.min(900, Math.round(s.w * dpr)), th = tw / CARD_RATIO
    const geo = cardGeometry(this.builtCardW, this.builtCardW / CARD_RATIO, this.builtCardW * CARD_DEPTH)
    await this.quiet()
    if (this.disposed) return list
    const back = canvas(tw * 0.5, th * 0.5); paintCardBack(back, data.id)
    const backTex = texture(back); this.renderer.initTexture(backTex)
    const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5, metalness: 0.2 })
    const edgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE[data.id].c2).lerp(new THREE.Color(0xf6f1e4), 0.55), roughness: 0.75 })
    const arts = await Promise.all(data.cards.map(card => card.art.kind === 'image' ? loadImage(card.art.src) : Promise.resolve(null)))
    const holder = new THREE.Group()
    for (const [k, card] of data.cards.entries()) {
      await this.quiet()
      if (this.disposed) return list
      const face = canvas(tw, th), foil = canvas(tw / 4, th / 4)
      paintCardFront(face, card, data.cards.length, arts[k]); paintCardFoil(foil, card)
      const faceTex = texture(face), foilTex = texture(foil, false)
      // Send them to the GPU now, between frames, instead of on the first frame that shows the card.
      this.renderer.initTexture(faceTex); this.renderer.initTexture(foilTex)
      const front = new THREE.MeshPhysicalMaterial({
        map: faceTex, roughness: 0.62, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 0.35,
        iridescence: 1, iridescenceMap: foilTex, iridescenceIOR: 1.8, iridescenceThicknessRange: [120, 900],
        // Its own picture as a light source, off until the card has to pass for that picture (see shade).
        emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: 0,
      })
      const obj: CardObj = { mesh: new THREE.Mesh(geo, [front, edgeMat, backMat]), current: pose(), front, image: '', flat: 0, away: 0 }
      holder.add(obj.mesh)
      list.push(obj)
      // The recap grid shows the same painting; encoding it off the main thread keeps frames smooth.
      face.toBlob(blob => { if (blob && !this.disposed) { obj.image = URL.createObjectURL(blob); this.emit() } })
    }
    // Compile the card shaders now, so the first frame of the opening doesn't stall on them.
    await this.renderer.compileAsync(holder, this.camera, this.scene)
    if (this.disposed) return list
    for (const c of list) { c.mesh.visible = false; this.deck.add(c.mesh) }
    this.cards.set(data.id, list)
    this.emit()
    return list
  }

  // The painted card faces as images, for the recap grid.
  cardImages(i: number) { return (this.cards.get(this.data[i].id) ?? []).map(c => c.image) }

  // ---------- Layout ----------

  resize(vw: number, vh: number) {
    this.vw = vw; this.vh = vh
    this.renderer.setSize(vw, vh, false)
    this.camera.aspect = vw / vh
    this.camera.position.set(0, 0, (vh / 2) / Math.tan((FOV / 2) * DEG))
    this.camera.near = 10; this.camera.far = this.camera.position.z * 4
    this.camera.updateProjectionMatrix()
  }

  private world(x: number, y: number) { return { x: x - this.vw / 2, y: this.vh / 2 - y } }

  private packTarget(i: number, t: number): Pose {
    const r = packRect(this.vw, this.vh), c = this.world(r.x + r.w / 2, r.y + r.h / 2)
    const off = i - this.state.active, focused = off === 0, spacing = packSpacing(this.vw, r.w)
    const { stage } = this.state
    if (this.exiting) {
      return focused ? pose({ x: c.x, y: c.y, s: this.packScale }) : pose({ x: c.x + off * spacing * 1.7, y: c.y, z: -160, ry: off * -20 * DEG, s: 0.8 * this.packScale, o: 0 })
    }
    if (stage === 'shelf') {
      const bob = focused && !this.reduced ? Math.sin(t / 640) * 4 : 0
      return pose({ x: c.x + off * spacing, y: c.y + bob, z: focused ? 0 : -160, ry: off * -20 * DEG, s: (focused ? 1 : 0.8) * this.packScale })
    }
    if (focused && this.state.zoom && (stage === 'tear' || stage === 'opening')) {
      const z = zoomRect(this.vw, this.vh), zc = this.world(z.x + z.w / 2, z.y + z.h / 2)
      return pose({ x: zc.x, y: zc.y, s: z.w / (this.builtPackW || 1) })
    }
    if (focused) return pose({ x: c.x, y: c.y, s: PICKED_SCALE * this.packScale })
    return pose({ x: c.x + off * spacing * 2.6, y: c.y, s: 0.7 * this.packScale, o: 0 })
  }

  // Where card n sits in the stack (n = 0 on top, -1 swiped away to the left).
  private stackPose(n: number): Pose {
    const s = stackRect(this.vw, this.vh), c = this.world(s.x + s.w / 2, s.y + s.h / 2)
    const k = this.cardScale
    if (n < 0) return pose({ x: c.x - (this.vw / 2 + s.w * 0.9), y: c.y - 24, z: 30, rz: -18 * DEG, ry: -40 * DEG, s: k })
    return pose({ x: c.x, y: c.y - n * 4, z: -n * s.w * CARD_DEPTH * 1.6, rz: FAN[Math.min(n, 3)] * DEG, s: (1 - n * 0.012) * k, o: n > 3 ? 0 : 1 })
  }

  // Card k inside the picked pack: `risen` sticks out of the torn top.
  private inPackPose(k: number, risen: boolean): Pose {
    // It follows the pack, wherever it is and however big (up close while it opens).
    const s = stackRect(this.vw, this.vh), p = this.packs[this.state.active].current
    const c = { x: p.x, y: p.y }
    const pw = this.builtPackW * p.s, ph = pw / PACK_RATIO, top = c.y + ph / 2
    const cw = pw * 0.9, ch = cw / CARD_RATIO, scale = cw / s.w
    const y = risen ? top - (RIP_Y * ph + ch * 0.06) : top - 0.17 * ph - ch / 2
    // Packed face to face, the top card in front.
    return pose({ x: c.x, y, z: (1 - k) * s.w * CARD_DEPTH * scale, s: scale * this.cardScale })
  }

  // ---------- State ----------

  private emit() { this.onChange({ ...this.state }) }
  private set(patch: Partial<StageState>) {
    // Something is about to move: keep the painting out of its way (see quiet).
    if (patch.stage !== undefined || patch.active !== undefined || patch.zoom !== undefined) {
      this.busyUntil = this.clock + (patch.stage === 'opening' ? OPEN_MS : patch.stage === 'closing' ? CLOSE_MS + this.gatherMs : 400)
    }
    Object.assign(this.state, patch); this.emit()
  }
  get stageName() { return this.state.stage }

  goTo(i: number) {
    if (this.state.stage !== 'shelf') return
    const active = clamp(i, 0, this.data.length - 1)
    if (active !== this.state.active) { this.set({ active }); void this.prepareCards(active) }
  }
  pick() {
    if (this.state.stage !== 'shelf') return
    // A tap before the textures are ready picks the pack as soon as they are.
    if (!this.state.ready) { this.pendingPick = true; return }
    const p = this.packs[this.state.active]
    p.spinAngle = p.spinTarget = 0; p.spinVel = 0
    this.set({ stage: 'tear', face: 'front' })
  }
  backToShelf() {
    if (this.state.stage !== 'tear' || this.pendingOpen) return
    this.dropTear()
    this.set({ stage: 'shelf', zoom: false })
  }
  // Stops a cut that's under way: the loose strip springs back onto the pack.
  private dropTear() {
    if (this.gesture?.mode === 'tear') this.gesture = null
    this.tear = null
    this.packs[this.state.active]?.strip.settle()
    if (this.state.tearing) this.set({ tearing: false })
  }
  // Up close with the front showing, ready to tear; and back out to spinning it around.
  zoomIn() {
    if (this.state.stage !== 'tear' || this.state.zoom || this.pendingOpen) return
    const p = this.packs[this.state.active]
    p.spinTarget = Math.round(p.spinAngle / (Math.PI * 2)) * Math.PI * 2
    this.set({ zoom: true, face: 'front' })
  }
  zoomOut() {
    if (this.state.stage !== 'tear' || !this.state.zoom || this.pendingOpen) return
    this.dropTear()
    this.set({ zoom: false })
  }
  flip() {
    if (this.state.stage !== 'tear' || this.tear || this.state.zoom || this.pendingOpen) return
    const p = this.packs[this.state.active]
    this.paintBack(this.state.active)
    p.spinTarget = Math.round(p.spinAngle / Math.PI) * Math.PI + Math.PI
    this.set({ face: Math.round(p.spinTarget / Math.PI) % 2 ? 'back' : 'front' })
  }
  openNow() {
    if (this.state.stage !== 'tear' || this.pendingOpen) return
    void this.startOpening(1)
  }
  next() { const n = this.count(); if (this.state.stage === 'stack' && this.state.index < n) this.set({ index: this.state.index + 1 }) }
  prev() { if (this.state.stage === 'stack' && this.state.index > 0) this.set({ index: this.state.index - 1 }) }
  // Jumps to a card. `from` is where the cards are drawn on the page (the recap grid): the ones
  // that end up on the stack fly over from there.
  show(index: number, from?: { x: number; y: number; w: number }[]) {
    if (this.state.stage !== 'stack') return
    const list = this.cards.get(this.data[this.state.active].id)
    if (from && list && from.length === list.length && !this.reduced && this.builtCardW) list.forEach((card, k) => {
      const n = k - index
      if (n < 0 || n > 3) return
      const c = this.world(from[k].x, from[k].y)
      card.current = pose({ x: c.x, y: c.y, s: from[k].w / this.builtCardW }); card.mesh.visible = true
      card.away = 1; this.shade(card, 1)
      this.showAt = this.clock
    })
    this.set({ index })
  }
  // `from` is where each card is drawn on the page (the recap grid), so they can be gathered from there.
  untear(from?: { x: number; y: number; w: number }[]) {
    if (this.state.stage !== 'stack') return
    const n = this.count()
    this.gather = from && from.length === n && !this.reduced && this.builtCardW
      ? from.map(r => { const c = this.world(r.x, r.y); return pose({ x: c.x, y: c.y, s: r.w / this.builtCardW }) })
      : null
    this.gatherMs = this.gather ? GATHER_HOLD + GATHER_FLY + GATHER_STAGGER * (n - 1) + 120 : 0
    // The closing starts once the deck is together, so time before that runs negative.
    this.stageStart = this.clock + this.gatherMs
    this.set({ stage: 'closing', index: this.state.index < this.count() ? this.state.index : 0 })
  }
  private count() { return this.data[this.state.active].cards.length }

  private resetFlap() {
    const p = this.packs[this.state.active]
    if (!p) return
    p.whole.visible = true; p.body.visible = p.flap.visible = false
    p.strip.reset()
    this.setOpacity(p, 1)
  }
  // A card taking over from its picture on the page starts out looking exactly like it (flat = 1):
  // unlit, with no shine. The light and the foil come in as it flies off (flat = 0).
  private shade(card: CardObj, flat: number) {
    if (card.flat === flat) return
    card.flat = flat
    const m = card.front, lit = 1 - flat
    m.color.setScalar(lit); m.specularIntensity = lit
    // Never quite zero, which would switch to another shader.
    m.iridescence = Math.max(0.001, lit); m.clearcoat = Math.max(0.001, 0.25 * lit)
    // (A touch over 1 makes up for what the tone mapping takes off.)
    m.emissiveIntensity = flat * 1.03
  }
  private setOpacity(p: PackObj, o: number, part: 'all' | 'flap' | 'body' = 'all') {
    const meshes = part === 'flap' ? [p.flap] : part === 'body' ? [p.body, p.whole] : [p.whole, p.body, p.flap]
    // The cut-out threshold fades along with it; left alone, anything under half opacity would vanish at once.
    for (const m of meshes) for (const mat of m.material as THREE.Material[]) { mat.opacity = o; mat.alphaTest = Math.max(0.02, 0.5 * o) }
  }

  private async startOpening(dir: number) {
    if (this.pendingOpen) return
    this.pendingOpen = true
    const p = this.packs[this.state.active]
    this.gesture = null; this.tear = null
    p.whole.visible = false; p.body.visible = p.flap.visible = true
    p.strip.release(dir)
    // Face the front the short way round, if it was still turning.
    p.spinTarget = Math.round(p.spinAngle / (Math.PI * 2)) * Math.PI * 2
    try { navigator.vibrate?.([10, 30, 18]) } catch { /* optional */ }
    await this.prepareCards(this.state.active)
    this.pendingOpen = false
    if (this.disposed) return
    this.stageStart = this.clock
    this.set({ stage: 'opening', index: 0, tearing: false })
  }

  // ---------- Input ----------

  private hit(event: PointerEvent, meshes: THREE.Object3D[]) {
    const rect = this.canvasEl.getBoundingClientRect()
    const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    return this.raycaster.intersectObjects(meshes, false)[0] ?? null
  }

  private down = (event: PointerEvent) => {
    if (event.button !== 0 || this.pendingOpen || this.exiting) return
    const { stage } = this.state
    let target: 'pack' | 'body' | 'none' = 'none', mode: 'tear' | null = null
    if (stage === 'tear') {
      const p = this.packs[this.state.active]
      const hit = this.hit(event, [p.whole])
      if (hit) {
        target = 'pack'
        // The strip above the tear line, on the front.
        if (this.state.zoom && this.state.face === 'front' && hit.uv && hit.uv.y > 1 - RIP_Y * 2 && hit.face && hit.face.normal.z > 0) mode = 'tear'
      }
    }
    if (stage === 'stack') {
      const top = this.topCard()
      if (top && this.hit(event, [top.mesh])) target = 'body'
    }
    this.gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), mode, lastX: event.clientX, lastT: performance.now(), v: 0, base: 0, target }
    if (mode === 'tear') this.beginTear(event)
    this.canvasEl.setPointerCapture(event.pointerId)
  }

  // How far across the picked pack the pointer is: 0 at its left edge, 1 at its right. Read off the
  // pack itself, so the cut stays under the finger while the pack moves or leans.
  private tearX(event: PointerEvent) {
    const p = this.packs[this.state.active]
    const hit = this.hit(event, [p.whole])
    if (hit?.uv && hit.face && hit.face.normal.z > 0) return hit.uv.x
    const c = p.current, w = this.builtPackW * c.s
    return clamp((event.clientX - (c.x + this.vw / 2 - w / 2)) / w)
  }

  private beginTear(event: PointerEvent) {
    const x = this.tearX(event)
    this.tear = { start: x, min: x, max: x, at: x, fromLeft: true, ticks: 0 }
  }

  private move = (event: PointerEvent) => {
    this.pointer = { x: event.clientX, y: event.clientY, t: performance.now() }
    const g = this.gesture
    if (!g || g.id !== event.pointerId) return
    const dx = event.clientX - g.x, dy = event.clientY - g.y, now = performance.now()
    if (g.mode === 'tear' && this.tear) {
      const t = this.tear, x = this.tearX(event)
      t.min = Math.min(t.min, x); t.max = Math.max(t.max, x); t.at = x; t.fromLeft = x >= t.start
      const span = t.max - t.min, atEdge = span > 0.4 && (t.fromLeft ? x >= 0.97 : x <= 0.03)
      const progress = atEdge ? 1 : Math.min(1, span / TEAR_DISTANCE)
      const p = this.packs[this.state.active]
      // A light tick every few millimetres of foil, like the real thing.
      const step = Math.floor(progress * 12)
      if (step > t.ticks) { t.ticks = step; try { navigator.vibrate?.(4) } catch { /* optional */ } }
      if (t.max - t.min > 0.02 && !this.state.tearing) { p.whole.visible = false; p.body.visible = p.flap.visible = true; this.set({ tearing: true }) }
      if (this.state.tearing) p.strip.peel(t.min, t.max, t.fromLeft)
      if (progress >= 1) void this.startOpening(t.fromLeft ? 1 : -1)
      return
    }
    if (!g.mode && Math.hypot(dx, dy) > 8) {
      const horizontal = Math.abs(dx) > Math.abs(dy)
      const { stage } = this.state
      g.mode = stage === 'shelf' ? 'swipe' : stage === 'tear' && horizontal && !this.state.zoom ? 'spin' : stage === 'stack' && horizontal ? 'card' : null
      if (!g.mode) { this.gesture = null; return }
      g.x = g.lastX = event.clientX; g.lastT = now
      g.base = this.packs[this.state.active]?.spinAngle ?? 0
      if (g.mode === 'spin') this.paintBack(this.state.active)
      return
    }
    if (g.mode === 'spin') {
      const p = this.packs[this.state.active]
      g.v = (event.clientX - g.lastX) / Math.max(1, now - g.lastT); g.lastX = event.clientX; g.lastT = now
      p.spinAngle = p.spinTarget = g.base + dx * 0.75 * DEG
    } else if (g.mode === 'card') {
      this.drag = { dx, active: true }
      g.v = (event.clientX - g.lastX) / Math.max(1, now - g.lastT); g.lastX = event.clientX; g.lastT = now
    }
  }

  private up = (event: PointerEvent) => {
    const g = this.gesture
    if (!g || g.id !== event.pointerId) return
    this.gesture = null
    const dx = event.clientX - g.x, dy = event.clientY - g.y
    const { stage } = this.state
    // Let go before the cut was finished: the strip springs back.
    if (g.mode === 'tear') { this.dropTear(); return }
    if (!g.mode) {
      // A tap.
      if (stage === 'shelf') {
        const hit = this.hit(event, this.packs.map(p => p.whole))
        if (hit) { const i = this.packs.findIndex(p => p.whole === hit.object); if (i === this.state.active) this.pick(); else this.goTo(i) }
      }
      // Tapping the pack brings it up close to tear. Tapping off it steps back: from up close to
      // spinning it, and from there to the shelf.
      if (stage === 'tear' && g.target === 'pack') this.zoomIn()
      if (stage === 'tear' && g.target === 'none') { if (this.state.zoom) this.zoomOut(); else this.backToShelf() }
      return
    }
    if (g.mode === 'swipe') { if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.goTo(this.state.active + (dx < 0 ? 1 : -1)); return }
    if (g.mode === 'spin') {
      const p = this.packs[this.state.active]
      p.spinTarget = Math.round((p.spinAngle + g.v * 160 * DEG) / Math.PI) * Math.PI
      this.set({ face: Math.abs(Math.round(p.spinTarget / Math.PI)) % 2 ? 'back' : 'front' })
      return
    }
    if (g.mode === 'card') {
      const s = stackRect(this.vw, this.vh)
      this.drag = { dx: 0, active: false }
      if (dx < -s.w * 0.22 || g.v < -0.45) this.next()
      else if (dx > s.w * 0.22 || g.v > 0.45) this.prev()
    }
  }

  private cancel = () => {
    this.gesture = null; this.drag = { dx: 0, active: false }
    if (this.tear) this.dropTear()
  }
  private leave = () => { this.pointer = null }

  private topCard() {
    const list = this.cards.get(this.data[this.state.active].id)
    return list?.[this.state.index] ?? null
  }

  // ---------- Frame ----------

  private loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, (now - this.last) / 1000) * this.timeScale; this.last = now
    this.clock += dt * 1000
    this.updateTilt(dt)
    this.updatePacks(this.clock, dt)
    this.updateCards(this.clock, dt)
    // Nothing is drawn until the shaders are compiled; until then the homepage's painted pack shows.
    if (!this.compiled || this.disposed) return
    // Two passes: the top card of the stack, and the one being swiped away, go on layer 1 and are
    // drawn over everything else, so a card moving past the stack never dips into it.
    this.renderer.clear()
    this.camera.layers.set(0); this.renderer.render(this.scene, this.camera)
    this.renderer.clearDepth()
    this.camera.layers.set(1); this.renderer.render(this.scene, this.camera)
    if (!this.state.ready) this.onFirstFrame()
  }

  private updateTilt(dt: number) {
    let target = { x: 0, y: 0 }
    if (this.pointer && performance.now() - this.pointer.t < 2500 && !this.gesture) {
      target = { x: (this.pointer.x / this.vw) * 2 - 1, y: (this.pointer.y / this.vh) * 2 - 1 }
    } else if (deviceTilt.active) target = { x: deviceTilt.x, y: deviceTilt.y }
    if (this.exiting) target = { x: 0, y: 0 }
    const k = 1 - Math.exp(-(this.exiting ? 14 : 6) * dt)
    this.tilt.x += (clamp(target.x, -1, 1) - this.tilt.x) * k
    this.tilt.y += (clamp(target.y, -1, 1) - this.tilt.y) * k
  }

  private updatePacks(now: number, dt: number) {
    const { stage, active } = this.state
    const elapsed = now - this.stageStart
    this.packs.forEach((p, i) => {
      let target = this.packTarget(i, now)
      const focused = i === active
      if (focused && (stage === 'opening' || stage === 'closing' || stage === 'stack')) target = pose({ ...this.packTarget(i, now) })
      if (this.state.ready) p.current = damp(p.current, target, dt, this.reduced ? 60 : this.exiting ? 14 : 9)
      apply(p.root, p.current)
      p.root.visible = p.current.o > 0.02 && !(focused && stage === 'stack')
      if (!focused) this.setOpacity(p, p.current.o)

      // Spin with a springy settle, and the holo tilt on top.
      if (focused && stage === 'tear') {
        if (this.gesture?.mode !== 'spin') p.spinAngle += (p.spinTarget - p.spinAngle) * (1 - Math.exp(-10 * dt))
      } else {
        // Unwind to the nearest whole turn so it doesn't spin around on the way back.
        p.spinAngle = Math.atan2(Math.sin(p.spinAngle), Math.cos(p.spinAngle))
        p.spinAngle += (0 - p.spinAngle) * (1 - Math.exp(-10 * dt)); p.spinTarget = 0
      }
      // The pack in front leans with the pointer or the phone: less up close, and not at all while
      // it's being cut. It eases in and out so nothing snaps when the pack or the stage changes.
      const steady = this.reduced || this.exiting || this.tear || this.pendingOpen || !focused || (stage !== 'shelf' && stage !== 'tear')
      p.lean += ((steady ? 0 : this.state.zoom ? 0.4 : 1) - p.lean) * (1 - Math.exp(-10 * dt))
      p.spin.rotation.set(this.tilt.y * 10 * DEG * p.lean, p.spinAngle + this.tilt.x * 14 * DEG * p.lean, 0)
    })

    const p = this.packs[active]
    if (!p) return
    const r = packRect(this.vw, this.vh), mouthY = (0.5 - RIP_Y) * r.h
    this.burst.visible = false; this.seal.visible = false
    this.updateCut(p, now, dt, elapsed)
    // The strip moves on its own: peeling while you cut, then flying off. It fades as it leaves.
    if (p.flap.visible && stage !== 'closing') {
      p.strip.step(dt)
      if (p.strip.flying) this.setOpacity(p, 1 - clamp((p.strip.flying - 0.6) / 0.4), 'flap')
      // A strip that was let go has sprung back flat: the pack is whole again.
      else if (p.strip.resting && !this.tear && !this.pendingOpen && (stage === 'tear' || stage === 'shelf')) this.resetFlap()
    }
    // On the way to the homepage: say when the pack is back in its place, facing front and whole.
    if (this.exiting && this.onSettled) {
      const to = this.packTarget(active, now), at = p.current
      const there = Math.abs(at.x - to.x) + Math.abs(at.y - to.y) < 2.5 && Math.abs(at.s - to.s) < 0.008 * to.s && Math.abs(p.spinAngle - p.spinTarget) < 0.03
      if ((there && (!p.flap.visible || stage !== 'tear')) || now >= this.settleBy) { const done = this.onSettled; this.onSettled = null; done() }
    }
    if (stage === 'opening' || stage === 'closing') {
      // Closing plays the opening backwards, then seals the tear.
      const t = stage === 'opening' ? elapsed : OPEN_MS - elapsed
      // The torn strip is gone by the time the pack closes again; it comes back when it seals.
      if (stage === 'closing' && elapsed <= OPEN_MS) p.flap.visible = false
      const drop = clamp((t - 800) / 450)
      p.body.position.y = -easeIn(drop) * r.h * 0.85
      p.body.position.z = 0
      this.setOpacity(p, 1 - clamp(drop / 0.75), 'body')
      if (stage === 'opening') {
        const b = clamp((t - 100) / 1200)
        this.burst.visible = b > 0 && b < 1
        const local = new THREE.Vector3(0, mouthY, 20).applyMatrix4(p.root.matrixWorld)
        this.burst.position.copy(local)
        this.burst.scale.setScalar(this.builtPackW * p.current.s * 2.26 * easeOut(b) + 1)
        this.burst.material.opacity = b < 0.25 ? b / 0.25 : 1 - (b - 0.25) / 0.75
        this.burst.material.color.setRGB(...PALETTE[this.data[active].id].glow.map(v => 0.6 + v / 640) as [number, number, number])
      }
      if (stage === 'closing') {
        const sealT = clamp((elapsed - OPEN_MS) / 400)
        // The strip fades back in along the tear line as the seal runs across it.
        if (elapsed > OPEN_MS) {
          if (!p.strip.resting) p.strip.reset()
          p.flap.visible = true
          this.setOpacity(p, 1, 'body'); this.setOpacity(p, clamp(sealT / 0.5), 'flap')
        }
        this.seal.visible = sealT > 0 && sealT < 1
        this.seal.position.copy(new THREE.Vector3(0, mouthY, r.w * PUFF).applyMatrix4(p.root.matrixWorld))
        this.seal.scale.set(r.w * PICKED_SCALE * (sealT < 0.4 ? sealT / 0.4 : 1), 14, 1)
        this.seal.material.opacity = sealT < 0.4 ? 1 : 1 - (sealT - 0.4) / 0.6
        if (elapsed >= CLOSE_MS) { this.resetFlap(); this.set({ stage: 'shelf', index: 0 }) }
      }
      if (stage === 'opening' && elapsed >= OPEN_MS) { this.set({ stage: 'stack', zoom: false }) }
    } else if (stage === 'tear' && !this.state.tearing) {
      p.body.position.set(0, 0, 0)
    }
  }

  // The light along the tear line: a faint pulse inviting the swipe, the cut following the finger,
  // and a flash along the whole line when it comes off.
  private updateCut(p: PackObj, now: number, dt: number, elapsed: number) {
    const { stage, tearing, face } = this.state
    for (const other of this.packs) if (other !== p) other.cut.visible = false
    const u = p.cut.material.uniforms, t = this.tear
    u.uTime.value = now / 1000
    const seam = stage === 'tear' && this.state.zoom && !tearing && face === 'front' && !this.exiting ? 1 : 0
    u.uSeam.value += (seam - u.uSeam.value) * (1 - Math.exp(-5 * dt))
    // The cut's light holds while cutting and fades out where it was when the finger lets go.
    if (stage === 'tear' && tearing && t) { u.uCut.value = 1; u.uFrom.value = t.fromLeft ? t.min : t.max; u.uTo.value = t.at }
    else u.uCut.value = u.uCut.value < 0.01 ? 0 : u.uCut.value * Math.exp(-14 * dt)
    u.uFlash.value = stage === 'opening' ? Math.max(0, 1 - elapsed / 420) : 0
    p.cut.visible = u.uSeam.value > 0.01 || u.uCut.value > 0 || u.uFlash.value > 0
  }

  private updateCards(now: number, dt: number) {
    const { stage, active, index } = this.state
    const id = this.data[active].id
    this.cards.forEach((list, key) => { if (key !== id) list.forEach(c => { c.mesh.visible = false }) })
    const list = this.cards.get(id)
    if (!list) return
    const elapsed = now - this.stageStart
    const s = stackRect(this.vw, this.vh)
    // The whole stack leans toward the pointer or the phone's tilt.
    // (Not while the recap is up: the cards fly to and from flat pictures on the page.)
    const c = this.world(s.x + s.w / 2, s.y + s.h / 2), lean = ((stage === 'stack' && index < list.length) || (stage === 'closing' && elapsed < 0)) && !this.reduced
    const follow = 1 - Math.exp(-12 * dt)
    this.deckLean.x += ((lean ? this.tilt.x : 0) - this.deckLean.x) * follow
    this.deckLean.y += ((lean ? this.tilt.y : 0) - this.deckLean.y) * follow
    this.deckPivot.position.set(c.x, c.y, 0); this.deck.position.set(-c.x, -c.y, 0)
    this.deckPivot.rotation.set(this.deckLean.y * 12 * DEG, this.deckLean.x * 16 * DEG, 0)
    list.forEach((card, k) => {
      const n = k - index
      card.mesh.layers.set(stage === 'stack' && n <= 0 ? 1 : 0)
      if (stage === 'closing' && this.gather && elapsed < 0) {
        // Gathering: each card slides from the grid onto the deck, lifting a little on the way,
        // the last one first so the first card ends on top.
        const from = this.gather[k], g = elapsed + this.gatherMs
        const u = ease(clamp((g - GATHER_HOLD - (list.length - 1 - k) * GATHER_STAGGER) / GATHER_FLY))
        // (Past the fourth they tuck in behind it, each a little deeper.)
        const home = k <= 3 ? this.stackPose(k) : pose({ ...this.stackPose(3), z: this.stackPose(k).z })
        const p = mix(from, home, u)
        p.z += Math.sin(Math.PI * u) * s.w * 0.35
        p.rz += Math.sin(Math.PI * u) * (k % 2 ? 6 : -6) * DEG
        card.current = p
        this.shade(card, flatFor(1 - u))
        card.mesh.visible = true
        card.mesh.renderOrder = u > 0 && u < 1 ? 20 + list.length - k : 4 - Math.min(k, 4)
        apply(card.mesh, card.current)
        return
      }
      if (stage !== 'stack') { card.away = 0; this.shade(card, 0) }
      if (stage === 'opening' || stage === 'closing') {
        // Cards rise out of the pack, wait at the opening while the wrapper drops, then come forward.
        const t = stage === 'opening' ? elapsed : OPEN_MS - elapsed
        const visible = n >= 0 && n <= 3
        card.mesh.visible = visible && t > 0
        // The rest wait where the stack will want them, so none flies in from somewhere stale.
        if (!visible) { card.current = this.stackPose(n < 0 ? -1 : 3); return }
        const local = clamp((t - 300 - n * 70) / 1250)
        const inside = this.inPackPose(n, false), risen = this.inPackPose(n, true), stacked = this.stackPose(n)
        card.current = local < 0.45 ? mix(inside, risen, easeOut(local / 0.45)) : local < 0.62 ? risen : mix(risen, stacked, ease((local - 0.62) / 0.38))
        apply(card.mesh, card.current)
        return
      }
      if (stage !== 'stack') { card.mesh.visible = false; return }
      card.mesh.visible = n >= -1 && n <= 3
      if (!card.mesh.visible) { card.current = this.stackPose(n < 0 ? -1 : 3); card.away = 0; this.shade(card, 0); return }
      // Cards coming over from the recap grid set off gently rather than at full speed.
      const ramp = clamp((now - this.showAt) / 220)
      const speed = this.reduced ? 60 : index >= list.length ? 16 : 10 * ramp * ramp * (3 - 2 * ramp)
      if (card.away) { card.away = card.away < 0.005 ? 0 : card.away * Math.exp(-speed * dt); this.shade(card, flatFor(card.away)) }
      let target = this.stackPose(n)
      if (this.drag.active) {
        const dx = this.drag.dx
        if (n === 0 && dx <= 0) target = pose({ ...target, x: target.x + dx, rz: target.rz - dx * 0.05 * DEG, ry: Math.max(-40, dx * 0.15) * DEG })
        if (n === 0 && dx > 0 && index === 0) target = pose({ ...target, x: target.x + dx * 0.25, ry: dx * 0.03 * DEG })
        if (n === -1 && dx > 0) {
          const p = Math.min(1, dx / (s.w * 0.9)), home = this.stackPose(0)
          target = mix(this.stackPose(-1), pose({ ...home, z: 30 }), p)
        }
      }
      card.current = this.drag.active && (n === 0 || n === -1) ? damp(card.current, target, dt, 30) : damp(card.current, target, dt, speed)
      apply(card.mesh, card.current)
      card.mesh.renderOrder = n < 0 ? 5 : 4 - n
    })
  }

  dispose() {
    this.disposed = true
    this.cards.forEach(list => list.forEach(c => c.image && URL.revokeObjectURL(c.image)))
    cancelAnimationFrame(this.frame)
    this.canvasEl.removeEventListener('pointerdown', this.down)
    this.canvasEl.removeEventListener('pointermove', this.move)
    this.canvasEl.removeEventListener('pointerup', this.up)
    this.canvasEl.removeEventListener('pointercancel', this.cancel)
    this.canvasEl.removeEventListener('pointerleave', this.leave)
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) { for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose(); m.dispose() }
      }
    })
    this.renderer.dispose()
  }
}
