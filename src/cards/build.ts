import { extractDescription } from '../lib/description.ts'
import type { CardData, PackData } from './types.ts'
import { AVATAR, PACK_META, PACK_ORDER } from './packMeta.ts'

type Entry = { slug: string; title: string; date: string; content: string }
type Post = Entry & { ogImage: { url: string } | string | null }
type Work = Entry & { url?: string; image?: string | null }
type Settings = { name: string; aboutBlurb: string; email?: string; github?: string; linkedin?: string; twitter?: string; chess?: string; youtube3dPrinting?: string }

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

export function buildPacks({ posts, works, settings }: { posts: Post[]; works: Work[]; settings: Settings }): PackData[] {
  const blog: CardData[] = newestFirst(posts).map((post, i) => {
    const image = typeof post.ogImage === 'string' ? post.ogImage : post.ogImage?.url
    return {
      id: `blog-${post.slug}`, pack: 'blog', no: i + 1, name: post.title, tag: 'POST',
      meta: [monthYear(post.date), `${readingMinutes(post.content)} MIN READ`],
      text: extractDescription(post.content, 150),
      art: image ? { kind: 'image', src: image } : { kind: 'icon', icon: 'quote' },
      links: [{ label: 'Read the post', href: `/blog/${post.slug}/` }],
      foot: `alexbiba.com/blog`,
    }
  })
  const built: CardData[] = newestFirst(works).map((work, i) => ({
    id: `works-${work.slug}`, pack: 'works', no: i + 1, name: work.title, tag: 'BUILT',
    meta: [work.date.slice(0, 4)],
    text: extractDescription(work.content, 150),
    art: work.image ? { kind: 'image', src: work.image } : { kind: 'icon', icon: 'quote' },
    links: [...(work.url ? [{ label: `Visit ${host(work.url)}`, href: work.url }] : []), { label: 'Read about it', href: `/works/${work.slug}/` }],
    foot: work.url ? host(work.url) : 'alexbiba.com/works',
  }))
  const social: Omit<CardData, 'no'>[] = [
    { id: 'social-alex', pack: 'social', name: settings.name, tag: 'ME', meta: ['ENGINEER', 'HUSBAND', 'DAD'], text: settings.aboutBlurb, art: { kind: 'image', src: AVATAR }, links: [], foot: 'alexbiba.com' },
  ]
  if (settings.github) social.push({ id: 'social-github', pack: 'social', name: 'GitHub', tag: 'CODE', meta: [`@${handle(settings.github)}`], text: 'The code behind my projects.', art: { kind: 'icon', icon: 'github' }, links: [{ label: 'Open GitHub', href: settings.github }], foot: host(settings.github) })
  if (settings.linkedin) social.push({ id: 'social-linkedin', pack: 'social', name: 'LinkedIn', tag: 'WORK', meta: ['PROFILE'], text: 'Where I’ve worked and what I’ve done there.', art: { kind: 'icon', icon: 'linkedin' }, links: [{ label: 'Open LinkedIn', href: settings.linkedin }], foot: host(settings.linkedin) })
  if (settings.twitter) social.push({ id: 'social-x', pack: 'social', name: 'X', tag: 'POSTS', meta: [`@${handle(settings.twitter)}`], text: 'Short updates on what I’m building.', art: { kind: 'icon', icon: 'x' }, links: [{ label: 'Open X', href: settings.twitter }], foot: host(settings.twitter) })
  if (settings.email) social.push({ id: 'social-email', pack: 'social', name: 'Email', tag: 'SAY HI', meta: ['INBOX'], text: 'The best way to reach me.', art: { kind: 'icon', icon: 'mail' }, links: [{ label: 'Send an email', href: `mailto:${settings.email}` }], foot: settings.email })
  if (settings.chess) social.push({ id: 'social-chess', pack: 'social', name: 'Chess.com', tag: 'HOBBY', meta: [handle(settings.chess).toUpperCase()], text: 'Up for a game? Find me on Chess.com.', art: { kind: 'icon', icon: 'chess' }, links: [{ label: 'Challenge me', href: settings.chess }], foot: host(settings.chess) })
  if (settings.youtube3dPrinting) social.push({ id: 'social-printing', pack: 'social', name: '3D printing', tag: 'HOBBY', meta: [`@${handle(settings.youtube3dPrinting)}`], text: 'I like making things I can actually hold. Watch my 3D prints on YouTube.', art: { kind: 'icon', icon: 'printer' }, links: [{ label: 'Watch on YouTube', href: settings.youtube3dPrinting }], foot: host(settings.youtube3dPrinting) })
  const cards = { blog, works: built, social: social.map((card, i) => ({ ...card, no: i + 1 })) }
  // The pack's window shows the art of its newest card that has a picture.
  const cover = (list: CardData[]) => list.map(card => card.art).find(art => art.kind === 'image')?.src
  return PACK_ORDER.map(id => ({ id, ...PACK_META[id], cover: cover(cards[id]), cards: cards[id] }))
}
