export type PackId = 'blog' | 'works' | 'social'
export type IconName = 'quote' | 'github' | 'linkedin' | 'x' | 'mail' | 'chess' | 'printer'
export type CardArt = { kind: 'image'; src: string } | { kind: 'icon'; icon: IconName }
export type CardLink = { label: string; href: string }
export type CardData = {
  id: string
  pack: PackId
  no: number
  name: string
  tag: string
  meta: string[]
  text: string
  art: CardArt
  links: CardLink[]
  foot: string
}
export type PackData = { id: PackId; title: string; subtitle: string; cards: CardData[] }
