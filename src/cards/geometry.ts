export const PACK_RATIO = 0.64

// Where the center pack sits on the pack shelf. The homepage morph lands on exactly this rect,
// so the shelf can take over without a visible jump.
export function packRect(vw: number, vh: number) {
  let h = Math.min(vh * 0.5, 420), w = h * PACK_RATIO
  if (w > vw * 0.6) { w = vw * 0.6; h = w / PACK_RATIO }
  return { w, h, x: (vw - w) / 2, y: vh * 0.47 - h / 2 }
}

// Horizontal distance between neighboring packs on the shelf.
export function packSpacing(vw: number, w: number) {
  return vw < 700 ? w * 0.82 : w * 1.18
}
