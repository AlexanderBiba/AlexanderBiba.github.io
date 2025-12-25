import imageUrlBuilder from '@sanity/image-url'
import { client } from '../../sanity/lib/client'
import type { SanityImageSource } from '@sanity/image-url'

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

