import CardGame from '../../src/cards/CardGame'
import { buildPacks } from '../../src/cards/build'
import { getAllPosts, getAllWorks, getSiteSettings } from '../../src/lib/content'
import { getSiteMetadata } from '../../src/lib/siteMetadata'

export async function generateMetadata() {
  return getSiteMetadata({ pathname: '/play/' })
}

export default async function PlayPage() {
  const [posts, works, settings] = await Promise.all([getAllPosts(), getAllWorks(), getSiteSettings()])
  return <CardGame packs={buildPacks({ posts, works, settings })} />
}
