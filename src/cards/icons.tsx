import type { IconName, PackId } from './types.ts'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function Icon({ name }: { name: IconName }) {
  switch (name) {
    case 'quote': return <svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M10 40c0-11 6-19 16-23l2 5c-6 3-9 7-9 12h1c5 0 8 3 8 8s-4 8-9 8c-6 0-9-4-9-10Zm24 0c0-11 6-19 16-23l2 5c-6 3-9 7-9 12h1c5 0 8 3 8 8s-4 8-9 8c-6 0-9-4-9-10Z" /></svg>
    case 'github': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><path d="M22 18 8 32l14 14M42 18l14 14-14 14M36 12 28 52" /></g></svg>
    case 'linkedin': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><rect x="8" y="20" width="48" height="32" rx="5" /><path d="M24 20v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5M8 34h48M32 31v6" /></g></svg>
    case 'x': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke} strokeWidth={5}><path d="M14 12h10l26 40H40ZM50 12 35 29M14 52l15-17" /></g></svg>
    case 'mail': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><rect x="8" y="14" width="48" height="36" rx="5" /><path d="m10 18 22 17 22-17" /></g></svg>
    case 'chess': return <svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M18 54h30v-6H18Zm3-9h24c0-9-1-17-6-24l-3-4 1-7c-3 0-6 2-8 4-6 2-10 7-12 13l-2 6 4 3 4-3 6-1c-4 4-7 8-8 13Zm8-25a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" /></svg>
    case 'printer': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><path d="M10 54V10h44v44M6 54h52M10 18h44" /><path d="M30 18v10l2 4 2-4V18" /><path d="M22 54v-8h20v8M26 46v-6h12v6" /></g></svg>
  }
}

export function PackEmblem({ pack }: { pack: PackId }) {
  switch (pack) {
    case 'blog': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><path d="M14 50 18 36 42 12l10 10-24 24Zm24-34 10 10M14 50l12-2" /><path d="M34 52h16" /></g></svg>
    case 'works': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><path d="M32 8 52 19v26L32 56 12 45V19Z" /><path d="M12 19l20 11 20-11M32 30v26" /></g></svg>
    case 'social': return <svg viewBox="0 0 64 64" aria-hidden="true"><g {...stroke}><path d="M10 14h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H26l-10 9v-9h-6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z" /><path d="M18 26h20M18 33h12" /></g></svg>
  }
}
