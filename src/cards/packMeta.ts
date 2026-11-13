import type { PackId } from './types.ts'

export const PACK_ORDER: PackId[] = ['blog', 'works', 'social']
// The pack the homepage morphs into, and the one the shelf starts on.
export const CENTER_PACK: PackId = 'works'
// The picture on the "me" card, which is also the Social pack's cover.
export const AVATAR = '/avatar.png'
export const PACK_META: Record<PackId, { title: string; subtitle: string }> = {
  blog: { title: 'BLOG', subtitle: 'What I write' },
  works: { title: 'BUILT', subtitle: 'Things I’ve built' },
  social: { title: 'SOCIAL', subtitle: 'Find me online' },
}
