import type { PackId } from './types.ts'

// Each pack's colors. The 3D textures and the light rays behind the packs both use these.
export type Palette = { p1: string; p2: string; p3: string; c1: string; c2: string; chrome: string; glow: [number, number, number] }

export const PALETTE: Record<PackId, Palette> = {
  blog: { p1: '#2a0624', p2: '#c0266a', p3: '#ff9a4d', c1: '#ffb18a', c2: '#e2477f', chrome: '#ffd9c2', glow: [255, 120, 150] },
  works: { p1: '#04142e', p2: '#0f5fae', p3: '#2ff0d0', c1: '#7cf0de', c2: '#2f6bff', chrome: '#d8fbff', glow: [80, 210, 255] },
  social: { p1: '#1d0b40', p2: '#6d3ae0', p3: '#ffc94a', c1: '#ffe7a0', c2: '#d6951a', chrome: '#fff1b8', glow: [255, 200, 90] },
}
