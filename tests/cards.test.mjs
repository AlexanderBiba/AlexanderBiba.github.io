import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildPacks, readingMinutes } from '../src/cards/build.ts'
import { packRect, stackRect, zoomRect } from '../src/cards/geometry.ts'

const read = (folder, entries) => entries.map(entry => ({ ...entry, content: readFileSync(`content/${folder}/${entry.slug}.md`, 'utf8') }))
const posts = read('blog', JSON.parse(readFileSync('content/blog.json', 'utf8')))
const works = read('works', JSON.parse(readFileSync('content/works.json', 'utf8')))
const settings = JSON.parse(readFileSync('content/site.json', 'utf8'))
const packs = buildPacks({ posts, works, settings })

test('there is a blog, works and social pack, in that order', () => {
  assert.deepEqual(packs.map(pack => pack.id), ['blog', 'works', 'social'])
})

test('every post and every work gets exactly one card, newest first', () => {
  const blog = packs.find(pack => pack.id === 'blog'), built = packs.find(pack => pack.id === 'works')
  assert.equal(blog.cards.length, posts.length)
  assert.equal(built.cards.length, works.length)
  assert.deepEqual(blog.cards.map(card => card.links[0].href), [...posts].sort((a, b) => b.date.localeCompare(a.date)).map(post => `/blog/${post.slug}/`))
  for (const work of works) assert.ok(built.cards.some(card => card.links.some(link => link.href === `/works/${work.slug}/`)))
})

test('the social pack links every profile in site.json', () => {
  const hrefs = packs.find(pack => pack.id === 'social').cards.flatMap(card => card.links.map(link => link.href))
  for (const key of ['github', 'linkedin', 'twitter', 'chess', 'youtube3dPrinting']) assert.ok(hrefs.includes(settings[key]), key)
  assert.ok(hrefs.includes(`mailto:${settings.email}`))
})

test('cards are numbered from 1 and have unique ids', () => {
  const cards = packs.flatMap(pack => pack.cards)
  assert.equal(new Set(cards.map(card => card.id)).size, cards.length)
  for (const pack of packs) assert.deepEqual(pack.cards.map(card => card.no), pack.cards.map((_, i) => i + 1))
  for (const card of cards) assert.ok(card.name && card.text, card.id)
})

test('reading time rounds to whole minutes and is at least one', () => {
  assert.equal(readingMinutes('word '.repeat(20)), 1)
  assert.equal(readingMinutes('word '.repeat(750)), 4)
})

test('the center pack fits on a phone and a desktop screen', () => {
  for (const [vw, vh] of [[390, 844], [360, 640], [1440, 900], [844, 390]]) {
    const r = packRect(vw, vh)
    assert.ok(r.x >= 0 && r.x + r.w <= vw && r.y >= 0 && r.y + r.h <= vh, `${vw}x${vh}`)
  }
})

test('up close, the pack leaves room above it for its words, with its tear line on screen', () => {
  for (const [vw, vh] of [[390, 844], [360, 640], [1440, 900], [844, 390], [1280, 560], [568, 320]]) {
    const z = zoomRect(vw, vh)
    assert.ok(z.y >= 128 && z.tearY < vh - 40, `${vw}x${vh}`)
  }
})

test('the card stack leaves room for the header and the controls under it', () => {
  for (const [vw, vh] of [[390, 844], [360, 640], [390, 664], [1440, 900]]) {
    const s = stackRect(vw, vh)
    assert.ok(s.x >= 16 && s.x + s.w <= vw - 16 && s.y >= 64 && s.y + s.h + 150 <= vh, `${vw}x${vh}`)
    assert.ok(Math.abs(s.w / s.h - 63 / 88) < 1e-9)
  }
})

test('the pack wrapper is flat at its sealed ends and side folds and puffed in the middle', async () => {
  const { pillow, teeth, rip, TEETH } = await import('../src/cards/shapes.ts')
  assert.equal(pillow(0.5, 0.02), 0)
  assert.equal(pillow(0.5, 0.98), 0)
  assert.equal(pillow(0, 0.5), 0)
  assert.equal(pillow(0.5, 0.5), 1)
  assert.equal(teeth(0, 1).length, TEETH * 2 + 1)
  assert.equal(rip[0][0], 0); assert.equal(rip.at(-1)[0], 1)
})

test('cards listed in card-art.json get their picture, and every picture and pack picture exists', async () => {
  const art = JSON.parse(readFileSync('content/card-art.json', 'utf8'))
  const { existsSync } = await import('node:fs')
  const { PACK_ART } = await import('../src/cards/packMeta.ts')
  const withArt = buildPacks({ posts, works, settings, art }).flatMap(pack => pack.cards)
  for (const [id, src] of Object.entries(art)) {
    assert.ok(existsSync(`public${src}`), `Missing ${src}`)
    const card = withArt.find(card => card.id === id)
    assert.ok(card, `card-art.json names a card that doesn't exist: ${id}`)
    assert.deepEqual({ kind: card.art.kind, src: card.art.src }, { kind: 'picture', src })
  }
  // A card that isn't listed keeps what it had.
  for (const card of withArt.filter(card => !art[card.id])) assert.notEqual(card.art.kind, 'picture', card.id)
  for (const pictures of Object.values(PACK_ART)) for (const src of Object.values(pictures)) assert.ok(existsSync(`public${src}`), `Missing ${src}`)
})
