import SocialMediaButtons from './SocialMediaButtons'
import { SiteSettings } from '../types/blog'

interface SocialMediaProps {
  settings?: SiteSettings | null
}

export default function SocialMedia({ settings }: SocialMediaProps) {
  if (!settings) return null

  return (
    <div className="content-container">
      <h2>Contact</h2>
      <SocialMediaButtons settings={settings} />
    </div>
  )
}

