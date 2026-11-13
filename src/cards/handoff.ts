// Set by the homepage 🎮 link right before it navigates, so /play/ knows the page already
// morphed into the center pack and can skip its own intro.
let morphedAt = 0
export const markMorphed = () => { morphedAt = Date.now() }
export const wasMorphed = () => Date.now() - morphedAt < 5000
export const MORPH_OVERLAY = 'data-pack-morph'

