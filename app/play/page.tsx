import House from '../../src/house/House'
import { getSiteMetadata } from '../../src/lib/siteMetadata'

export async function generateMetadata() {
  return getSiteMetadata({ pathname: '/play/' })
}

export default function PlayPage() { return <House /> }
