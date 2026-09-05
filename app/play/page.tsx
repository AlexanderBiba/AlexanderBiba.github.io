import type { Metadata } from 'next'
import House from '../../src/house/House'

export const metadata: Metadata = {
  title: 'Play — Alex Biba',
  description: 'Explore Alex Biba’s interactive house. Discover his projects, music, workshop, and family in a cozy 3D adventure.',
  alternates: { canonical: 'https://alexbiba.com/play/' },
  openGraph: { title: 'Play — Alex Biba', description: 'Projects, writing, and life at home.', url: 'https://alexbiba.com/play/', images: ['/avatar.png'] },
}
export default function PlayPage() { return <House /> }
