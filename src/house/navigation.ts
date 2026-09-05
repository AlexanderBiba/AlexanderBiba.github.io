export type Point = { x: number; z: number }
export type Obstacle = { x: number; z: number; w: number; d: number }
export const LIMIT_X = 5.55
export const LIMIT_Z = 4.55
export function walkable(p: Point, obstacles: Obstacle[], padding = 0.23) {
  return Math.abs(p.x) <= LIMIT_X && Math.abs(p.z) <= LIMIT_Z && !obstacles.some(o => Math.abs(p.x - o.x) < o.w / 2 + padding && Math.abs(p.z - o.z) < o.d / 2 + padding)
}
// A small navigation grid keeps point-and-click walks out of the furniture.
export function findPath(start: Point, end: Point, obstacles: Obstacle[]): Point[] {
  const step = 0.3, width = 37, height = 31
  const point = (id: number): Point => ({ x: (id % width - 18) * step, z: (Math.floor(id / width) - 15) * step })
  const nearest = (p: Point) => {
    let best = -1, distance = Infinity
    for (let id = 0; id < width * height; id++) {
      const q = point(id), d = Math.hypot(q.x - p.x, q.z - p.z)
      if (d < distance && walkable(q, obstacles)) { best = id; distance = d }
    }
    return best
  }
  const from = nearest(start), to = nearest(end)
  if (from < 0 || to < 0) return []
  const queue = [from], visited = new Map<number, number>([[from, -1]])
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor]
    if (id === to) break
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = id % width + dx, z = Math.floor(id / width) + dz, next = z * width + x
      if (x < 0 || x >= width || z < 0 || z >= height || visited.has(next) || !walkable(point(next), obstacles)) continue
      visited.set(next, id); queue.push(next)
    }
  }
  if (!visited.has(to)) return []
  const path: Point[] = []
  for (let id = to; id !== from; id = visited.get(id)!) path.unshift(point(id))
  return path
}

export type InteractionTarget = { group: { position: Point }; approach: Point; zone?: { w: number; d: number } }
export function interactionDistance(point: Point, target: InteractionTarget) {
  if (!target.zone) return Math.hypot(point.x - target.approach.x, point.z - target.approach.z)
  return Math.hypot(Math.max(0, Math.abs(point.x - target.group.position.x) - target.zone.w / 2), Math.max(0, Math.abs(point.z - target.group.position.z) - target.zone.d / 2))
}

/** Shared reach check for prompts, E, clicks, and completing a walk to any hotspot. */
export function canInteract(point: Point, target: InteractionTarget) {
  return interactionDistance(point, target) < (target.zone ? .95 : 1.35)
}

/** Choose a reachable side of an object instead of sending everyone to its front. */
export function interactionPath(start: Point, target: InteractionTarget, obstacles: Obstacle[]) {
  if (!target.zone) return findPath(start, target.approach, obstacles)
  const { x, z } = target.group.position, { w, d } = target.zone
  const candidates: Point[] = []
  for (const side of [-1, 1]) for (let i = 0; i <= 4; i++) {
    candidates.push({ x: x + side * (w / 2 + .48), z: z + (i / 4 - .5) * d })
    candidates.push({ x: x + (i / 4 - .5) * w, z: z + side * (d / 2 + .48) })
  }
  candidates.push(target.approach)
  candidates.sort((a, b) => Math.hypot(a.x - start.x, a.z - start.z) - Math.hypot(b.x - start.x, b.z - start.z))
  for (const candidate of candidates) {
    if (!walkable(candidate, obstacles)) continue
    const path = findPath(start, candidate, obstacles)
    if (path.length && interactionDistance(path[path.length - 1], target) < .85) return path
  }
  return []
}
export const isMovementKey = (key: string) => ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key.toLowerCase())

