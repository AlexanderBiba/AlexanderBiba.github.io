import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildPacks, readingMinutes } from '../src/cards/build.ts'
import { packRect } from '../src/cards/geometry.ts'

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
