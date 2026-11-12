// A modern booster pack is about 66 × 120 mm.
export const PACK_RATIO = 0.55

// Where the center pack sits on the pack shelf. The homepage morph lands on exactly this rect,
// so the shelf can take over without a visible jump.
export function packRect(vw: number, vh: number) {
  let h = Math.min(vh * 0.52, 480), w = h * PACK_RATIO
  if (w > vw * 0.6) { w = vw * 0.6; h = w / PACK_RATIO }
  return { w, h, x: (vw - w) / 2, y: vh * 0.45 - h / 2 }
}

// Horizontal distance between neighboring packs on the shelf.
export function packSpacing(vw: number, w: number) {
  return vw < 700 ? w * 0.82 : w * 1.18
}

// A standard trading card is 63 × 88 mm.
export const CARD_RATIO = 63 / 88
// Room kept above the card stack for the header, and below it for the links and arrows.
const STACK_TOP = 76, STACK_BOTTOM = 170

// Where the top card of the stack sits. The opening animation ends on exactly this rect,
// so the cards that come out of the pack are the same ones you then swipe through.
export function stackRect(vw: number, vh: number) {
  let h = Math.min(vh - STACK_TOP - STACK_BOTTOM, 540), w = h * CARD_RATIO
  if (w > Math.min(vw - 64, 380)) { w = Math.min(vw - 64, 380); h = w / CARD_RATIO }
  return { w, h, x: (vw - w) / 2, y: STACK_TOP + Math.max(0, (vh - STACK_TOP - STACK_BOTTOM - h) / 2) }
}
