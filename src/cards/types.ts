export type PackId = 'blog' | 'works' | 'social'
export type IconName = 'quote' | 'github' | 'linkedin' | 'x' | 'mail' | 'chess' | 'printer'
// `image`: a screenshot or portrait. `picture`: art made for the card, with the icon it falls back
// to if the picture can't load.
export type CardArt = { kind: 'image'; src: string } | { kind: 'picture'; src: string; icon?: IconName } | { kind: 'icon'; icon: IconName }
export type CardLink = { label: string; href: string }
export type CardData = {
  id: string
  pack: PackId
  no: number
  name: string
  tag: string
  meta: string[]
  // The big number in the card's corner, when it has one: minutes to read, the year it was built.
  stat?: { label: string; value: string }
  text: string
  art: CardArt
  links: CardLink[]
  foot: string
}
export type PackData = { id: PackId; title: string; subtitle: string; cards: CardData[] }
