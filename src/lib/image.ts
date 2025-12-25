import imageUrlBuilder from '@sanity/image-url'
import { client } from '../../sanity/lib/client'
import type { SanityImageSource } from '@sanity/image-url'

const builder = client ? imageUrlBuilder(client) : null

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error('Sanity client is not configured')
  }
  return builder.image(source)
}

