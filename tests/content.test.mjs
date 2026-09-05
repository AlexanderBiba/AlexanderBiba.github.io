import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

for (const collection of ['blog', 'projects']) {
  test(`${collection}: every indexed entry has a body and all local images exist`, () => {
    const entries = JSON.parse(readFileSync(`content/${collection}.json`, 'utf8'))
    assert.equal(new Set(entries.map(entry => entry.slug)).size, entries.length)
    for (const entry of entries) {
      assert.match(entry.slug, /^[a-z0-9-]+$/)
      assert.ok(entry.title && Number.isFinite(Date.parse(entry.date)))
      const body = readFileSync(`content/${collection}/${entry.slug}.md`, 'utf8')
      assert.ok(body.trim(), `${entry.slug} has its full article body`)
      const serialized = `${JSON.stringify(entry)}\n${body}`
      for (const image of [entry.ogImage, entry.image, entry.previewImage].filter(Boolean)) {
        assert.match(typeof image === 'string' ? image : image.url, /^\/content\//, 'cover images must be repository assets')
      }
      for (const asset of serialized.match(/\/content\/[^\s"<>\)]+/g) || []) {
        assert.ok(existsSync(`public${asset}`), `Missing ${asset}`)
      }
    }
  })
}
