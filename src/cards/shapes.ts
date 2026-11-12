// Shapes shared by the 2D painters and the 3D meshes, in fractions of the pack's width and height
// (x from the left, y from the top).

export const TEETH = 16
// How deep the serrated teeth along the crimped ends cut in, as a share of the height.
export const TOOTH = 0.016
// The tear line, and the jagged rip just under it.
export const RIP_Y = 0.13
const RIP = [0.6, -0.8, 1.1, -0.3, 0.9, -1, 0.2, 1.2, -0.6, 0.5, -1.1, 0.8, 0, -0.7, 1, -0.4, 0.7, -0.9, 0.3, 1.1, -0.5, 0.6, -1, 0.4, 0]
export const rip: [number, number][] = RIP.map((d, i) => [i / (RIP.length - 1), RIP_Y + d / 100])
// The crimped, sealed ends of the wrapper, where it's flat.
export const CRIMP = 0.065

// Points along a serrated end from left to right: the tips sit on `edge` and the notches cut
// `inward` (1 for the top end, -1 for the bottom).
export function teeth(edge: number, inward: 1 | -1): [number, number][] {
  return Array.from({ length: TEETH * 2 + 1 }, (_, i) => [i / (TEETH * 2), edge + (i % 2 ? inward * TOOTH : 0)] as [number, number])
}

// How puffed up the wrapper is at (x, y), from 0 (flat) to 1. The long sides are folds, so it
// rounds off toward them, and the crimped ends are sealed flat.
export function pillow(x: number, y: number) {
  const side = Math.sqrt(Math.max(0, 1 - Math.abs(2 * x - 1) ** 6))
  const end = Math.min(smooth(CRIMP, CRIMP + 0.07, y), smooth(CRIMP, CRIMP + 0.07, 1 - y))
  return side * end
}

function smooth(a: number, b: number, t: number) {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

// A tiny seeded random generator, so the foil crinkles look the same on every visit.
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
