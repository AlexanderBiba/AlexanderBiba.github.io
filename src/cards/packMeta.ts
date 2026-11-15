import type { PackId } from './types.ts'

export const PACK_ORDER: PackId[] = ['blog', 'works', 'social']
// The pack the homepage morphs into, and the one the shelf starts on.
export const CENTER_PACK: PackId = 'works'
// The picture on the "me" card.
export const AVATAR = '/avatar.png'
// The art on each pack: the picture on its front, a cutout of its creature (so the 3D pack's foil
// shines around the creature and not on it) and a wide picture of the creature for the window of
// a card that has no picture of its own. Until they load, or if they can't, the creature drawn in
// code (packArt.ts) stands in.
const packArt = (id: PackId) => ({ front: `/content/cards/pack-${id}.webp`, mask: `/content/cards/pack-${id}-mask.png`, window: `/content/cards/window-${id}.webp` })
export const PACK_ART: Record<PackId, { front: string; mask: string; window: string }> = { blog: packArt('blog'), works: packArt('works'), social: packArt('social') }
export const PACK_META: Record<PackId, { title: string; subtitle: string }> = {
  blog: { title: 'BLOG', subtitle: 'What I write' },
  works: { title: 'BUILT', subtitle: 'Things I’ve built' },
  social: { title: 'SOCIAL', subtitle: 'Find me online' },
}
