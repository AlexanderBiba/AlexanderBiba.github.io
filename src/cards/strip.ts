// The strip you tear off the top of a pack, as a little sheet of foil: a grid of points held
// together by springs (Verlet integration), so it bends, peels and flutters instead of moving
// as one rigid piece. Coordinates are the pack's local ones (CSS pixels, y up).
import * as THREE from 'three'
import { RIP_Y, pillow } from './shapes.ts'

const NX = 24, NY = 4
// The strip reaches a bit below the tear line so the jagged rip (cut by the alpha mask) fits.
const DEPTH_Y = RIP_Y + 0.016
const STEP = 1 / 120

type Link = [number, number, number, number] // a, b, rest length, stiffness

export class FoilStrip {
  readonly geometry = new THREE.BufferGeometry()
  private n = (NX + 1) * (NY + 1)
  private p = new Float32Array(this.n * 3)
  private prev = new Float32Array(this.n * 3)
  private rest = new Float32Array(this.n * 3)
  private pinned = new Uint8Array(this.n)
  private links: Link[] = []
  private thick = new Float32Array(this.n)
  private fx = new Float32Array(this.n)
  // While peeling: where the loose part is still attached (local x), and which way it's loose
  // (-1 toward the left, 1 toward the right, 0 when it's held at both ends).
  private attachX = 0
  private looseDir = 0
  private lo = 0
  private hi = 0
  private mode: 'rest' | 'peel' | 'fly' = 'rest'
  private time = 0
  private spin = 0

  constructor(private w: number, private h: number, depth: number) {
    const idx = (i: number, j: number) => j * (NX + 1) + i
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const k = idx(i, j), fx = i / NX, fy = (j / NY) * DEPTH_Y
      this.rest.set([(fx - 0.5) * w, (0.5 - fy) * h, 0], k * 3)
      this.thick[k] = depth / 2 * pillow(fx, fy) + 0.4
      this.fx[k] = fx
    }
    const link = (a: number, b: number, stiff: number) => {
      const d = Math.hypot(...[0, 1, 2].map(c => this.rest[a * 3 + c] - this.rest[b * 3 + c]))
      this.links.push([a, b, d, stiff])
    }
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      if (i < NX) link(idx(i, j), idx(i + 1, j), 1)
      if (j < NY) link(idx(i, j), idx(i, j + 1), 1)
      if (i < NX && j < NY) { link(idx(i, j), idx(i + 1, j + 1), 0.8); link(idx(i + 1, j), idx(i, j + 1), 0.8) }
      // Skipping one point resists bending, which is what makes it foil rather than cloth.
      if (i < NX - 1) link(idx(i, j), idx(i + 2, j), 0.9)
      if (j < NY - 1) link(idx(i, j), idx(i, j + 2), 1)
    }

    // Front and back surfaces share the simulated points, pushed apart by the pack's puff.
    const uv: number[] = [], index: number[] = []
    for (const side of [1, -1]) for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const fx = i / NX, fy = (j / NY) * DEPTH_Y
      uv.push(side === 1 ? fx : 1 - fx, 1 - fy)
    }
    const faces = (base: number, flip: boolean) => {
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const a = base + idx(i, j), b = a + 1, c = a + NX + 1, d = c + 1
        if (flip) index.push(a, b, c, b, d, c); else index.push(a, c, b, b, c, d)
      }
    }
    faces(0, false); faces(this.n, true)
    this.geometry.setIndex(index)
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.n * 6), 3))
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    // Groups match the pack's materials: 0 front, 1 back.
    this.geometry.addGroup(0, index.length / 2, 0); this.geometry.addGroup(index.length / 2, index.length / 2, 1)
    this.reset()
  }

  // Back on the pack, flat and attached.
  reset() {
    this.p.set(this.rest); this.prev.set(this.rest); this.pinned.fill(1)
    this.mode = 'rest'; this.time = 0
    this.updateGeometry()
  }

  // While cutting: the part between lo and hi (fractions of the width) is loose, the rest still
  // sealed. Near an edge the loose part runs off that edge, as it would on a real pack.
  peel(lo: number, hi: number) {
    if (lo < 0.12) lo = -1
    if (hi > 0.88) hi = 2
    this.mode = 'peel'
    for (let k = 0; k < this.n; k++) {
      const free = this.fx[k] > lo && this.fx[k] < hi
      if (!free && !this.pinned[k]) { this.pinned[k] = 1; this.p.set(this.rest.subarray(k * 3, k * 3 + 3), k * 3); this.prev.set(this.rest.subarray(k * 3, k * 3 + 3), k * 3) }
      if (free) this.pinned[k] = 0
    }
    this.looseDir = lo < 0 && hi > 1 ? 0 : lo < 0 ? -1 : hi > 1 ? 1 : 0
    this.attachX = ((this.looseDir < 0 ? hi : lo) - 0.5) * this.w
    this.lo = lo; this.hi = hi
  }

  // Where a loose point wants to be while peeling: the strip curls away from the pack in an arc
  // starting where it's still attached, lifting a little as it goes, like a sticker being peeled.
  private peelTarget(k: number, out: number[]) {
    const x0 = this.rest[k * 3], y0 = this.rest[k * 3 + 1]
    if (!this.looseDir) {
      // Cut in the middle and held at both ends: it just bulges out.
      const u = Math.min(1, Math.max(0, (this.fx[k] - this.lo) / Math.max(0.01, this.hi - this.lo)))
      const z = Math.sin(Math.PI * u) * this.w * 0.05
      out[0] = x0; out[1] = y0 + z * 0.3; out[2] = z
      return
    }
    const s = (x0 - this.attachX) * this.looseDir, kappa = 2.4 / this.w, max = 1.5
    const arc = Math.min(s, max / kappa), rest = s - arc, a = kappa * arc, r = 1 / kappa
    const along = r * Math.sin(a) + rest * Math.cos(a), z = r * (1 - Math.cos(a)) + rest * Math.sin(a)
    out[0] = this.attachX + this.looseDir * along; out[1] = y0 + z * 0.55; out[2] = z
  }

  // Fully cut: it lets go and flies up and off toward `dir` (1 right, -1 left), tumbling.
  release(dir: number) {
    this.mode = 'fly'; this.time = 0; this.pinned.fill(0); this.spin = dir
    for (let k = 0; k < this.n; k++) {
      // Velocity in px per step: up and toward the viewer, the far end faster so it turns over.
      const along = this.fx[k] - 0.5
      const v = [dir * 3.2 + along * 1.2, 7.5 - Math.abs(along) * 2 + dir * along * 4, 2.5 + along * dir * 3]
      for (let c = 0; c < 3; c++) this.prev[k * 3 + c] = this.p[k * 3 + c] - v[c]
    }
  }

  step(dt: number) {
    if (this.mode === 'rest') return
    let left = Math.min(dt, 0.1)
    while (left > 0) { this.substep(); left -= STEP; this.time += STEP }
    this.updateGeometry()
  }

  private substep() {
    const { p, prev, pinned } = this
    const peel = this.mode === 'peel'
    // Peeling: the loose foil springs up and toward you, more toward its free end. Flying: a
    // little gravity, drag and flutter.
    const damping = peel ? 0.88 : 0.985, target = [0, 0, 0]
    for (let k = 0; k < this.n; k++) {
      if (pinned[k]) continue
      const o = k * 3
      let ax = 0, ay = 0, az = 0
      if (peel) {
        this.peelTarget(k, target)
        ax = (target[0] - p[o]) * 0.06; ay = (target[1] - p[o + 1]) * 0.06; az = (target[2] - p[o + 2]) * 0.06
      } else {
        ay = -0.06
        az = Math.sin(this.time * 16 + this.fx[k] * 7) * 0.35
        ax = Math.cos(this.time * 11 + this.fx[k] * 5) * 0.15 * this.spin
      }
      const x = p[o], y = p[o + 1], z = p[o + 2]
      p[o] += (x - prev[o]) * damping + ax
      p[o + 1] += (y - prev[o + 1]) * damping + ay
      p[o + 2] += (z - prev[o + 2]) * damping + az
      prev[o] = x; prev[o + 1] = y; prev[o + 2] = z
    }
    for (let it = 0; it < 6; it++) {
      for (const [a, b, len, stiff] of this.links) {
        const ia = a * 3, ib = b * 3
        const dx = p[ib] - p[ia], dy = p[ib + 1] - p[ia + 1], dz = p[ib + 2] - p[ia + 2]
        const d = Math.hypot(dx, dy, dz) || 1e-6
        const wa = pinned[a] ? 0 : 1, wb = pinned[b] ? 0 : 1
        if (!wa && !wb) continue
        const f = ((d - len) / d) * stiff / (wa + wb)
        p[ia] += dx * f * wa; p[ia + 1] += dy * f * wa; p[ia + 2] += dz * f * wa
        p[ib] -= dx * f * wb; p[ib + 1] -= dy * f * wb; p[ib + 2] -= dz * f * wb
      }
      // While peeling it can't sink into the pack behind it.
      if (peel) for (let k = 0; k < this.n; k++) if (!pinned[k] && p[k * 3 + 2] < 0) p[k * 3 + 2] = 0
    }
  }

  // Seconds since it let go, for fading it out.
  get flying() { return this.mode === 'fly' ? this.time : 0 }

  private updateGeometry() {
    const pos = this.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array, { p } = this
    const at = (i: number, j: number) => (Math.min(NY, Math.max(0, j)) * (NX + 1) + Math.min(NX, Math.max(0, i))) * 3
    const tx = new THREE.Vector3(), ty = new THREE.Vector3(), nrm = new THREE.Vector3()
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, o = k * 3
      const r = at(i + 1, j), l = at(i - 1, j), d = at(i, j + 1), u = at(i, j - 1)
      tx.set(p[r] - p[l], p[r + 1] - p[l + 1], p[r + 2] - p[l + 2])
      ty.set(p[u] - p[d], p[u + 1] - p[d + 1], p[u + 2] - p[d + 2])
      nrm.crossVectors(tx, ty).normalize()
      const t = this.thick[k]
      for (const [side, base] of [[1, 0], [-1, this.n * 3]] as const) {
        arr[base + o] = p[o] + nrm.x * t * side
        arr[base + o + 1] = p[o + 1] + nrm.y * t * side
        arr[base + o + 2] = p[o + 2] + nrm.z * t * side
      }
    }
    pos.needsUpdate = true
    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
  }
}
