import { extractDescription } from '../lib/description.ts'
import type { CardArt, CardData, PackData } from './types.ts'
import { AVATAR, PACK_META, PACK_ORDER } from './packMeta.ts'

type Entry = { slug: string; title: string; date: string; content: string }
type Post = Entry & { ogImage: { url: string } | string | null }
type Work = Entry & { url?: string; image?: string | null }
type Settings = { name: string; aboutBlurb: string; github?: string; linkedin?: string; twitter?: string; chess?: string; youtube3dPrinting?: string }

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const monthYear = (date: string) => `${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`
const newestFirst = <T extends { date: string }>(items: T[]) => [...items].sort((a, b) => b.date.localeCompare(a.date))
// The handle is the last path segment of a profile URL, e.g. x.com/alexander_biba -> alexander_biba.
const handle = (url: string) => url.replace(/\/+$/, '').split('/').pop()!.replace(/^@/, '')
const host = (url: string) => new URL(url).hostname.replace(/^www\./, '')

export function readingMinutes(markdown: string) {
  const words = markdown.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// `art` maps a card's id to a picture made for it (content/card-art.json). It wins over what the
// card would show otherwise, and a card that isn't listed keeps its screenshot, portrait or icon.
export function buildPacks({ posts, works, settings, art = {} }: { posts: Post[]; works: Work[]; settings: Settings; art?: Record<string, string> }): PackData[] {
  const blog: CardData[] = newestFirst(posts).map((post, i) => {
    const image = typeof post.ogImage === 'string' ? post.ogImage : post.ogImage?.url
    return {
      id: `blog-${post.slug}`, pack: 'blog', no: i + 1, name: post.title, tag: 'POST',
      meta: [monthYear(post.date)], stat: { label: 'MIN READ', value: String(readingMinutes(post.content)) },
      text: extractDescription(post.content, 150),
      art: image ? { kind: 'image', src: image } : { kind: 'icon', icon: 'quote' },
      links: [{ label: 'Read the post', href: `/blog/${post.slug}/` }],
      foot: `alexbiba.com/blog`,
    }
  })
  const built: CardData[] = newestFirst(works).map((work, i) => ({
    id: `works-${work.slug}`, pack: 'works', no: i + 1, name: work.title, tag: 'BUILT',
    meta: [work.url ? host(work.url) : 'alexbiba.com/works'], stat: { label: 'YEAR', value: work.date.slice(0, 4) },
    text: extractDescription(work.content, 150),
    art: work.image ? { kind: 'image', src: work.image } : { kind: 'icon', icon: 'quote' },
    links: [...(work.url ? [{ label: `Visit ${host(work.url)}`, href: work.url }] : []), { label: 'Read about it', href: `/works/${work.slug}/` }],
    foot: 'alexbiba.com/works',
  }))
  const social: Omit<CardData, 'no'>[] = [
    { id: 'social-alex', pack: 'social', name: settings.name, tag: 'ME', meta: ['ENGINEER', 'HUSBAND', 'DAD'], text: settings.aboutBlurb, art: { kind: 'image', src: AVATAR }, links: [], foot: 'alexbiba.com' },
  ]
  if (settings.github) social.push({ id: 'social-github', pack: 'social', name: 'GitHub', tag: 'CODE', meta: [`@${handle(settings.github)}`], text: 'The code behind my projects.', art: { kind: 'icon', icon: 'github' }, links: [{ label: 'Open GitHub', href: settings.github }], foot: host(settings.github) })
  if (settings.linkedin) social.push({ id: 'social-linkedin', pack: 'social', name: 'LinkedIn', tag: 'WORK', meta: ['PROFILE'], text: 'Where I’ve worked and what I’ve done there.', art: { kind: 'icon', icon: 'linkedin' }, links: [{ label: 'Open LinkedIn', href: settings.linkedin }], foot: host(settings.linkedin) })
  if (settings.twitter) social.push({ id: 'social-x', pack: 'social', name: 'X', tag: 'POSTS', meta: [`@${handle(settings.twitter)}`], text: 'Short updates on what I’m building.', art: { kind: 'icon', icon: 'x' }, links: [{ label: 'Open X', href: settings.twitter }], foot: host(settings.twitter) })
  if (settings.chess) social.push({ id: 'social-chess', pack: 'social', name: 'Chess.com', tag: 'HOBBY', meta: [handle(settings.chess).toUpperCase()], text: 'Up for a game? Find me on Chess.com.', art: { kind: 'icon', icon: 'chess' }, links: [{ label: 'Challenge me', href: settings.chess }], foot: host(settings.chess) })
  if (settings.youtube3dPrinting) social.push({ id: 'social-printing', pack: 'social', name: '3D printing', tag: 'HOBBY', meta: [`@${handle(settings.youtube3dPrinting)}`], text: 'I like making things I can actually hold. Watch my 3D prints on YouTube.', art: { kind: 'icon', icon: 'printer' }, links: [{ label: 'Watch on YouTube', href: settings.youtube3dPrinting }], foot: host(settings.youtube3dPrinting) })
  const withArt = <T extends Omit<CardData, 'no'>>(card: T): T => {
    const src = art[card.id]
    if (!src) return card
    const picture: CardArt = { kind: 'picture', src, ...(card.art.kind === 'icon' ? { icon: card.art.icon } : {}) }
    return { ...card, art: picture }
  }
  const cards = { blog: blog.map(withArt), works: built.map(withArt), social: social.map((card, i) => ({ ...withArt(card), no: i + 1 })) }
  return PACK_ORDER.map(id => ({ id, ...PACK_META[id], cards: cards[id] }))
}
