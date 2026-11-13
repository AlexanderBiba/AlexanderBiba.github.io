// The card packs as a Three.js scene: foil packs you can spin and tear, and solid cards that
// slide out of them into a stack you swipe through. World units are CSS pixels on the z = 0
// plane, so a rect from geometry.ts lands on exactly the same spot on screen.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CARD_RATIO, PACK_RATIO, packRect, packSpacing, stackRect } from './geometry.ts'
import { paintCardBack, paintCardFoil, paintCardFront, paintPackBack, paintPackFront, paintPackMask, loadImage } from './paint.ts'
import { PALETTE } from './palette.ts'
import { RIP_Y, pillow } from './shapes.ts'
import { tilt as deviceTilt } from './motion.ts'
import { FoilStrip } from './strip.ts'
import type { PackData } from './types.ts'

export type Stage = 'shelf' | 'tear' | 'opening' | 'stack' | 'closing'
export type StageState = { stage: Stage; active: number; index: number; face: 'front' | 'back'; tearing: boolean; ready: boolean }

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
export const OPEN_MS = 1900, CLOSE_MS = 2300
const FAN = [0, -1.6, 1.3, -0.9]
// Putting the laid-out cards back: each flies from its spot into the deck, the last card first.
const GATHER_FLY = 560, GATHER_STAGGER = 70
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
function texture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// The wrapper: a closed foil pillow. Front and back meet at the folded long sides and are
// sealed flat at the crimped ends. Groups: 0 front, 1 back, 2 inside of the front, 3 inside of the back.
export function pillowGeometry(w: number, h: number, depth: number, segX = 28, segY = 56) {
  const g = new THREE.BufferGeometry()
  const pos: number[] = [], uv: number[] = [], index: number[] = []
  const grid = (side: 1 | -1) => {
    const base = pos.length / 3
    for (let j = 0; j <= segY; j++) for (let i = 0; i <= segX; i++) {
      const fx = i / segX, fy = j / segY
      pos.push((fx - 0.5) * w, (0.5 - fy) * h, side * depth / 2 * pillow(fx, fy))
      uv.push(side === 1 ? fx : 1 - fx, 1 - fy)
    }
    return base
  }
  const faces = (base: number, flip: boolean) => {
    const start = index.length
    for (let j = 0; j < segY; j++) for (let i = 0; i < segX; i++) {
      const a = base + j * (segX + 1) + i, b = a + 1, c = a + segX + 1, d = c + 1
      if (flip) index.push(a, b, c, b, d, c); else index.push(a, c, b, b, c, d)
    }
    return [start, index.length - start]
  }
  // The insides get their own vertices so their normals point inward instead of cancelling out.
  const front = grid(1), back = grid(-1), frontInside = grid(1), backInside = grid(-1)
  const groups = [faces(front, false), faces(back, true), faces(frontInside, true), faces(backInside, false)]
  g.setIndex(index)
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  groups.forEach(([start, count], i) => g.addGroup(start, count, i))
  g.computeVertexNormals()
  return g
}

// The band along the tear line where the cut glows, lying on the pack's front, as a share of its height.
const CUT_BAND = 0.11
function cutGeometry(w: number, h: number, depth: number, seg = 28) {
  const g = new THREE.BufferGeometry(), pos: number[] = [], uv: number[] = [], index: number[] = []
  const y = (0.5 - RIP_Y) * h, band = h * CUT_BAND
  for (let i = 0; i <= seg; i++) {
    const fx = i / seg, z = depth / 2 * pillow(fx, RIP_Y) + 1
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
        float seam = uSeam * (0.3 + 0.2 * sin(uTime * 3.5)) * (core + halo * 0.25);
        float flash = uFlash * (core * 2.0 + halo * 0.8);
        // Fade to nothing before the band's edges and ends so it never shows as a rectangle.
        float edge = (1.0 - smoothstep(0.5, 1.0, abs(d))) * smoothstep(0.0, 0.04, vUv.x) * (1.0 - smoothstep(0.96, 1.0, vUv.x));
        float a = (cut + seam + flash) * edge;
        vec3 col = mix(uColor, vec3(1.0), clamp(core * 0.9 + head * 0.8, 0.0, 1.0));
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
  cut: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; strip: FoilStrip
}
type CardObj = { mesh: THREE.Mesh; current: Pose; front: THREE.MeshPhysicalMaterial; image: string }
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
  private state: StageState = { stage: 'shelf', active: 1, index: 0, face: 'front', tearing: false, ready: false }
  private stageStart = 0
  // Where the cards start when they're gathered back up from the recap grid, and how long it takes.
  private gather: Pose[] | null = null
  private gatherMs = 0
  // Scene time in ms. It advances by at most 50 ms a frame, so a slow frame or a busy tab
  // slows the animations down instead of skipping them.
  private clock = 0
  // ?slowmo=10 plays every animation ten times slower, for checking them frame by frame.
  private timeScale = 1
  private tear: { start: number; min: number; max: number; left: number; width: number; at: number; fromLeft: boolean; ticks: number } | null = null
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
  private compiled = false
  // Set when the page arrived through the homepage morph: the side packs slide in once it's drawn.
  private intro = false
  // Set while leaving for the homepage: the side packs slide away and the pick pack holds still.
  private exiting = false
  private cardJobs = new Map<string, Promise<CardObj[]>>()
  private covers: Promise<(HTMLImageElement | null)[]>
  private fronts: HTMLCanvasElement[] = []
  // Sizes the meshes were built at; a resize scales them instead of rebuilding.
  private builtPackW = 0
  private builtCardW = 0
  private get packScale() { return this.builtPackW ? packRect(this.vw, this.vh).w / this.builtPackW : 1 }
  private get cardScale() { return this.builtCardW ? stackRect(this.vw, this.vh).w / this.builtCardW : 1 }

  constructor(private canvasEl: HTMLCanvasElement, private data: PackData[], private onChange: (state: StageState) => void, { active, intro }: StageOptions) {
    // Start loading the cover art right away, so it arrives while the scene is set up.
    this.covers = Promise.all(data.map(p => p.cover ? loadImage(p.cover) : Promise.resolve(null)))
    this.intro = intro
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.timeScale = 1 / Math.max(1, Number(new URLSearchParams(window.location.search).get('slowmo')) || 1)
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
    this.build().then(async () => {
      // Compile the shaders before the first frame, without blocking where the browser can do it
      // in the background, so the hand-off from the homepage doesn't stall on it.
      // The torn parts and the cut light are hidden until a tear, but compile them now too.
      const hidden = this.packs.flatMap(p => [p.body, p.flap, p.cut])
      hidden.forEach(m => { m.visible = true })
      await this.renderer.compileAsync(this.scene, this.camera)
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

  private async build() {
    const { w, h } = packRect(this.vw, this.vh)
    this.builtPackW = w
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    const tw = Math.min(1024, Math.round(w * PICKED_SCALE * dpr)), th = tw / PACK_RATIO
    const geo = pillowGeometry(w, h, w * PUFF), cutGeo = cutGeometry(w, h, w * PUFF)
    const masks = (['whole', 'flap', 'body'] as const).map(part => { const c = canvas(512, 512 / PACK_RATIO); paintPackMask(c, part); return texture(c, false) })
    const covers = await this.covers
    this.data.forEach((data, i) => {
      // The back only shows once a pack is picked and spun, so it's painted later (paintBacks).
      const front = canvas(tw, th), back = canvas(tw, th)
      paintPackFront(front, { id: data.id, count: data.cards.length, cover: covers[i] })
      this.fronts[i] = front
      const frontTex = texture(front), backTex = texture(back)
      const foil = (map: THREE.Texture, alphaMap: THREE.Texture) => new THREE.MeshPhysicalMaterial({
        map, alphaMap, alphaTest: 0.5, transparent: true, metalness: 0.2, roughness: 0.45,
        clearcoat: 0.35, clearcoatRoughness: 0.3, iridescence: 0.4, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 750],
      })
      const inside = (alphaMap: THREE.Texture) => new THREE.MeshPhysicalMaterial({ color: 0xc8cdd8, alphaMap, alphaTest: 0.5, transparent: true, metalness: 0.9, roughness: 0.35 })
      const make = (alpha: THREE.Texture) => {
        const mats = [foil(frontTex, alpha), foil(backTex, alpha), inside(alpha), inside(alpha)]
        return new THREE.Mesh(geo, mats)
      }
      const whole = make(masks[0]), body = make(masks[2])
      // The strip you tear off is its own soft piece of foil (strip.ts).
      const strip = new FoilStrip(w, h, w * PUFF)
      const flap = new THREE.Mesh(strip.geometry, [foil(frontTex, masks[1]), foil(backTex, masks[1])])
      const cut = new THREE.Mesh(cutGeo, cutMaterial(PALETTE[data.id].glow))
      // Makes the bright head at the finger round: the band is this many times longer than half its height.
      cut.material.uniforms.uAspect.value = 2 * PACK_RATIO / CUT_BAND
      cut.renderOrder = 10; cut.visible = false
      const root = new THREE.Group(), spin = new THREE.Group()
      body.visible = flap.visible = false
      spin.add(whole, body, flap, cut); root.add(spin)
      this.scene.add(root)
      const mats = [whole, body, flap].flatMap(m => m.material as THREE.MeshPhysicalMaterial[])
      const obj: PackObj = { root, spin, whole, body, flap, mats, current: pose(), spinAngle: 0, spinTarget: 0, spinVel: 0, cut, strip }
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
    this.state.ready = true; this.emit()
    if (this.pendingPick) { this.pendingPick = false; this.pick() }
    await this.paintBacks()
    void this.prepareCards(this.state.active)
  }

  private async paintBacks() {
    for (const [i, p] of this.packs.entries()) {
      await idle()
      if (this.disposed) return
      const data = this.data[i], mat = (p.whole.material as THREE.MeshPhysicalMaterial[])[1]
      const tex = mat.map!
      paintPackBack(tex.image as HTMLCanvasElement, { id: data.id, names: data.cards.map(c => c.name) })
      tex.needsUpdate = true
    }
  }

  // The front art of pack i, as painted for its texture (the homepage morph reuses it on the way back).
  packFront(i: number) { return this.fronts[i] ?? null }

  // Before going back to the homepage: the side packs slide away and the middle one settles.
  exit() { this.exiting = true }

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
    const back = canvas(tw * 0.5, th * 0.5); paintCardBack(back, data.id)
    const backMat = new THREE.MeshStandardMaterial({ map: texture(back), roughness: 0.5, metalness: 0.2 })
    const edgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE[data.id].c2).lerp(new THREE.Color(0xf6f1e4), 0.55), roughness: 0.75 })
    const arts = await Promise.all(data.cards.map(card => card.art.kind === 'image' ? loadImage(card.art.src) : Promise.resolve(null)))
    const holder = new THREE.Group()
    for (const [k, card] of data.cards.entries()) {
      await idle()
      if (this.disposed) return list
      const face = canvas(tw, th), foil = canvas(tw / 4, th / 4)
      paintCardFront(face, card, data.cards.length, arts[k]); paintCardFoil(foil, card)
      const front = new THREE.MeshPhysicalMaterial({
        map: texture(face), roughness: 0.62, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 0.35,
        iridescence: 1, iridescenceMap: texture(foil, false), iridescenceIOR: 1.8, iridescenceThicknessRange: [120, 900],
      })
      const obj: CardObj = { mesh: new THREE.Mesh(geo, [front, edgeMat, backMat]), current: pose(), front, image: '' }
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
    const r = packRect(this.vw, this.vh), s = stackRect(this.vw, this.vh)
    const c = this.world(r.x + r.w / 2, r.y + r.h / 2)
    const pw = r.w * PICKED_SCALE, ph = r.h * PICKED_SCALE, top = c.y + ph / 2
    const cw = pw * 0.9, ch = cw / CARD_RATIO, scale = cw / s.w
    const y = risen ? top - (RIP_Y * ph + ch * 0.06) : top - 0.17 * ph - ch / 2
    // Packed face to face, the top card in front.
    return pose({ x: c.x, y, z: (1 - k) * s.w * CARD_DEPTH * scale, s: scale * this.cardScale })
  }

  // ---------- State ----------

  private emit() { this.onChange({ ...this.state }) }
  private set(patch: Partial<StageState>) { Object.assign(this.state, patch); this.emit() }
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
  backToShelf() { if (this.state.stage === 'tear') { this.resetFlap(); this.set({ stage: 'shelf' }) } }
  flip() {
    if (this.state.stage !== 'tear' || this.tear) return
    const p = this.packs[this.state.active]
    p.spinTarget = Math.round(p.spinAngle / Math.PI) * Math.PI + Math.PI
    this.set({ face: Math.round(p.spinTarget / Math.PI) % 2 ? 'back' : 'front' })
  }
  async openNow() {
    if (this.state.stage !== 'tear') return
    this.startOpening(1)
  }
  next() { const n = this.count(); if (this.state.stage === 'stack' && this.state.index < n) this.set({ index: this.state.index + 1 }) }
  prev() { if (this.state.stage === 'stack' && this.state.index > 0) this.set({ index: this.state.index - 1 }) }
  show(index: number) { if (this.state.stage === 'stack') this.set({ index }) }
  // `from` is where each card is drawn on the page (the recap grid), so they can be gathered from there.
  untear(from?: { x: number; y: number; w: number }[]) {
    if (this.state.stage !== 'stack') return
    const n = this.count()
    this.gather = from && from.length === n && !this.reduced && this.builtCardW
      ? from.map(r => { const c = this.world(r.x, r.y); return pose({ x: c.x, y: c.y, s: r.w / this.builtCardW }) })
      : null
    this.gatherMs = this.gather ? GATHER_FLY + GATHER_STAGGER * (n - 1) + 120 : 0
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
  private setOpacity(p: PackObj, o: number, part: 'all' | 'flap' | 'body' = 'all') {
    const meshes = part === 'flap' ? [p.flap] : part === 'body' ? [p.body, p.whole] : [p.whole, p.body, p.flap]
    for (const m of meshes) for (const mat of m.material as THREE.Material[]) mat.opacity = o
  }

  private async startOpening(dir: number) {
    const p = this.packs[this.state.active]
    this.tear = null
    p.whole.visible = false; p.body.visible = p.flap.visible = true
    p.strip.release(dir)
    p.spinAngle = p.spinTarget = 0
    await this.prepareCards(this.state.active)
    try { navigator.vibrate?.([10, 30, 18]) } catch { /* optional */ }
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
    if (event.button !== 0) return
    const { stage } = this.state
    let target: 'pack' | 'body' | 'none' = 'none', mode: 'tear' | null = null
    if (stage === 'tear') {
      const p = this.packs[this.state.active]
      const hit = this.hit(event, [p.whole])
      if (hit) {
        target = 'pack'
        // The strip above the tear line, on the front.
        if (this.state.face === 'front' && hit.uv && hit.uv.y > 1 - RIP_Y * 2 && hit.face && hit.face.normal.z > 0) mode = 'tear'
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

  private beginTear(event: PointerEvent) {
    const r = packRect(this.vw, this.vh), w = r.w * PICKED_SCALE, left = r.x - (w - r.w) / 2
    const x = clamp((event.clientX - left) / w)
    this.tear = { start: x, min: x, max: x, left, width: w, at: x, fromLeft: true, ticks: 0 }
  }

  private move = (event: PointerEvent) => {
    this.pointer = { x: event.clientX, y: event.clientY, t: performance.now() }
    const g = this.gesture
    if (!g || g.id !== event.pointerId) return
    const dx = event.clientX - g.x, dy = event.clientY - g.y, now = performance.now()
    if (g.mode === 'tear' && this.tear) {
      const t = this.tear, x = clamp((event.clientX - t.left) / t.width)
      t.min = Math.min(t.min, x); t.max = Math.max(t.max, x); t.at = x; t.fromLeft = x >= t.start
      const span = t.max - t.min, atEdge = span > 0.4 && (t.fromLeft ? x >= 0.97 : x <= 0.03)
      const progress = atEdge ? 1 : Math.min(1, span / TEAR_DISTANCE)
      const p = this.packs[this.state.active]
      // A light tick every few millimetres of foil, like the real thing.
      const step = Math.floor(progress * 12)
      if (step > t.ticks) { t.ticks = step; try { navigator.vibrate?.(4) } catch { /* optional */ } }
      if (t.max - t.min > 0.02 && !this.state.tearing) { p.whole.visible = false; p.body.visible = p.flap.visible = true; this.set({ tearing: true }) }
      if (this.state.tearing) p.strip.peel(t.min, t.max)
      if (progress >= 1) { this.gesture = null; void this.startOpening(t.fromLeft ? 1 : -1) }
      return
    }
    if (!g.mode && Math.hypot(dx, dy) > 8) {
      const horizontal = Math.abs(dx) > Math.abs(dy)
      const { stage } = this.state
      g.mode = stage === 'shelf' ? 'swipe' : stage === 'tear' && horizontal ? 'spin' : stage === 'stack' && horizontal ? 'card' : null
      if (!g.mode) { this.gesture = null; return }
      g.x = g.lastX = event.clientX; g.lastT = now
      g.base = this.packs[this.state.active]?.spinAngle ?? 0
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
    if (g.mode === 'tear') {
      if (this.tear && this.tear.max - this.tear.min < 0.02) this.set({ tearing: false })
      if (this.state.stage === 'tear') { this.tear = null; this.resetFlap(); this.set({ tearing: false }) }
      return
    }
    if (!g.mode) {
      // A tap.
      if (stage === 'shelf') {
        const hit = this.hit(event, this.packs.map(p => p.whole))
        if (hit) { const i = this.packs.findIndex(p => p.whole === hit.object); if (i === this.state.active) this.pick(); else this.goTo(i) }
      }
      // Tapping anywhere off the picked pack puts it back on the shelf.
      if (stage === 'tear' && g.target === 'none') this.backToShelf()
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
    if (this.tear) { this.tear = null; this.resetFlap(); this.set({ tearing: false }) }
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
      if (this.state.ready) p.current = damp(p.current, target, dt, this.reduced ? 60 : this.exiting && !focused ? 14 : 9)
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
      const tiltOn = focused && (stage === 'shelf' || stage === 'tear') && !this.reduced
      p.spin.rotation.set(tiltOn ? this.tilt.y * 10 * DEG : 0, p.spinAngle + (tiltOn ? this.tilt.x * 14 * DEG : 0), 0)
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
    }
    if (stage === 'opening' || stage === 'closing') {
      // Closing plays the opening backwards, then seals the tear.
      const t = stage === 'opening' ? elapsed : OPEN_MS - elapsed
      // The torn strip is gone by the time the pack closes again; it comes back when it seals.
      if (stage === 'closing') p.flap.visible = false
      const drop = clamp((t - 800) / 450)
      p.body.position.y = -easeIn(drop) * r.h * 0.85
      p.body.position.z = 0
      this.setOpacity(p, 1 - clamp(drop / 0.75), 'body')
      if (stage === 'opening') {
        const b = clamp((t - 100) / 1200)
        this.burst.visible = b > 0 && b < 1
        const local = new THREE.Vector3(0, mouthY, 20).applyMatrix4(p.root.matrixWorld)
        this.burst.position.copy(local)
        this.burst.scale.setScalar(r.w * 2.4 * easeOut(b) + 1)
        this.burst.material.opacity = b < 0.25 ? b / 0.25 : 1 - (b - 0.25) / 0.75
        this.burst.material.color.setRGB(...PALETTE[this.data[active].id].glow.map(v => 0.6 + v / 640) as [number, number, number])
      }
      if (stage === 'closing') {
        const sealT = clamp((elapsed - OPEN_MS) / 400)
        if (elapsed > OPEN_MS) {
          p.flap.visible = p.body.visible = false; p.whole.visible = true; this.setOpacity(p, 1)
        }
        this.seal.visible = sealT > 0 && sealT < 1
        this.seal.position.copy(new THREE.Vector3(0, mouthY, r.w * PUFF).applyMatrix4(p.root.matrixWorld))
        this.seal.scale.set(r.w * PICKED_SCALE * (sealT < 0.4 ? sealT / 0.4 : 1), 14, 1)
        this.seal.material.opacity = sealT < 0.4 ? 1 : 1 - (sealT - 0.4) / 0.6
        if (elapsed >= CLOSE_MS) { this.resetFlap(); this.set({ stage: 'shelf', index: 0 }) }
      }
      if (stage === 'opening' && elapsed >= OPEN_MS) { this.set({ stage: 'stack' }) }
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
    const seam = stage === 'tear' && !tearing && face === 'front' && !this.exiting ? 1 : 0
    u.uSeam.value += (seam - u.uSeam.value) * (1 - Math.exp(-5 * dt))
    u.uCut.value = stage === 'tear' && tearing && t ? 1 : 0
    if (u.uCut.value && t) { u.uFrom.value = t.fromLeft ? t.min : t.max; u.uTo.value = t.at }
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
    const c = this.world(s.x + s.w / 2, s.y + s.h / 2), lean = (stage === 'stack' || (stage === 'closing' && elapsed < 0)) && !this.reduced
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
        const u = ease(clamp((g - (list.length - 1 - k) * GATHER_STAGGER) / GATHER_FLY))
        const home = k <= 2 ? this.stackPose(k) : pose({ ...this.stackPose(2), z: this.stackPose(3).z })
        const p = mix(from, home, u)
        p.z += Math.sin(Math.PI * u) * s.w * 0.35
        p.rz += Math.sin(Math.PI * u) * (k % 2 ? 6 : -6) * DEG
        card.current = p
        card.mesh.visible = true
        card.mesh.renderOrder = u > 0 && u < 1 ? 20 + list.length - k : 4 - Math.min(k, 4)
        apply(card.mesh, card.current)
        return
      }
      if (stage === 'opening' || stage === 'closing') {
        // Cards rise out of the pack, wait at the opening while the wrapper drops, then come forward.
        const t = stage === 'opening' ? elapsed : OPEN_MS - elapsed
        const visible = n >= 0 && n <= 2
        card.mesh.visible = visible && t > 0
        if (!visible) return
        const local = clamp((t - 300 - n * 70) / 1250)
        const inside = this.inPackPose(n, false), risen = this.inPackPose(n, true), stacked = this.stackPose(n)
        card.current = local < 0.45 ? mix(inside, risen, easeOut(local / 0.45)) : local < 0.62 ? risen : mix(risen, stacked, ease((local - 0.62) / 0.38))
        apply(card.mesh, card.current)
        return
      }
      if (stage !== 'stack') { card.mesh.visible = false; return }
      card.mesh.visible = n >= -1 && n <= 3
      if (!card.mesh.visible) { card.current = this.stackPose(n < 0 ? -1 : 3); return }
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
      card.current = this.drag.active && (n === 0 || n === -1) ? damp(card.current, target, dt, 30) : damp(card.current, target, dt, this.reduced ? 60 : index >= list.length ? 16 : 10)
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
