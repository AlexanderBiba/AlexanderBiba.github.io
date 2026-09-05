import type { Metadata } from 'next'
import House from '../../src/house/House'

export const metadata: Metadata = {
  title: 'Explore — Alex Biba',
  description: 'Explore Alex Biba’s interactive house. Discover his projects, music, workshop, and family in a cozy 3D adventure.',
  alternates: { canonical: 'https://alexbiba.com/explore/' },
  openGraph: { title: 'Explore — Alex Biba', description: 'Projects, writing, and life at home.', url: 'https://alexbiba.com/explore/', images: ['/avatar.png'] },
}
export default function ExplorePage() { return <House /> }
